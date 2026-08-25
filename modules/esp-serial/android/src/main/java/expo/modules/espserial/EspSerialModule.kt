package expo.modules.espserial

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import androidx.core.content.ContextCompat
import com.hoho.android.usbserial.driver.UsbSerialDriver
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

private const val ACTION_USB_PERMISSION = "expo.modules.espserial.USB_PERMISSION"
private const val WRITE_TIMEOUT_MS = 2000

class UsbDeviceRecord : Record {
  @Field
  var id: Int = 0

  @Field
  var vendorId: Int = 0

  @Field
  var productId: Int = 0

  @Field
  var deviceName: String = ""

  @Field
  var driverType: String = ""
}

class EspSerialModule : Module() {
  private var currentPort: UsbSerialPort? = null
  private var currentDeviceId: Int? = null
  private var ioManager: SerialInputOutputManager? = null
  private var permissionReceiver: BroadcastReceiver? = null
  private var attachDetachReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("EspSerial")

    Events("onData", "onDeviceAttached", "onDeviceDetached", "onError")

    OnCreate {
      val filter = IntentFilter().apply {
        addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
        addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
      }
      val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
          @Suppress("DEPRECATION")
          val device = intent.getParcelableExtra<UsbDevice>(UsbManager.EXTRA_DEVICE) ?: return
          when (intent.action) {
            UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
              val driver = UsbSerialProber.getDefaultProber().probeDevice(device)
              if (driver != null) {
                sendEvent("onDeviceAttached", deviceMap(driver))
              }
            }
            UsbManager.ACTION_USB_DEVICE_DETACHED -> {
              val wasConnected = device.deviceId == currentDeviceId
              if (wasConnected) {
                closeCurrentConnection()
              }
              sendEvent(
                "onDeviceDetached",
                mapOf("id" to device.deviceId, "wasConnected" to wasConnected),
              )
            }
          }
        }
      }
      attachDetachReceiver = receiver
      ContextCompat.registerReceiver(
        requireContext(),
        receiver,
        filter,
        ContextCompat.RECEIVER_NOT_EXPORTED,
      )
    }

    OnDestroy {
      closeCurrentConnection()
      attachDetachReceiver?.let { runCatching { requireContext().unregisterReceiver(it) } }
      attachDetachReceiver = null
      permissionReceiver?.let { runCatching { requireContext().unregisterReceiver(it) } }
      permissionReceiver = null
    }

    AsyncFunction("listDevices") {
      UsbSerialProber.getDefaultProber().findAllDrivers(requireUsbManager()).map { toDeviceRecord(it) }
    }

    AsyncFunction("requestPermission") { deviceId: Int, promise: Promise ->
      val manager = requireUsbManager()
      val device = findDevice(manager, deviceId)
      if (device == null) {
        promise.reject("ERR_DEVICE_NOT_FOUND", "No USB device with id $deviceId", null)
        return@AsyncFunction
      }
      if (manager.hasPermission(device)) {
        promise.resolve(true)
        return@AsyncFunction
      }

      val context = requireContext()
      permissionReceiver?.let { runCatching { context.unregisterReceiver(it) } }

      val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
          if (intent.action != ACTION_USB_PERMISSION) return
          runCatching { context.unregisterReceiver(this) }
          permissionReceiver = null
          val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
          promise.resolve(granted)
        }
      }
      permissionReceiver = receiver
      ContextCompat.registerReceiver(
        context,
        receiver,
        IntentFilter(ACTION_USB_PERMISSION),
        ContextCompat.RECEIVER_NOT_EXPORTED,
      )

      val permissionIntent = PendingIntent.getBroadcast(
        context,
        0,
        Intent(ACTION_USB_PERMISSION).setPackage(context.packageName),
        PendingIntent.FLAG_MUTABLE,
      )
      manager.requestPermission(device, permissionIntent)
    }

    AsyncFunction("open") { deviceId: Int, baudRate: Int ->
      val manager = requireUsbManager()
      val driver = findDriver(manager, deviceId)
        ?: throw IllegalArgumentException("No USB device with id $deviceId")
      val device = driver.device
      if (!manager.hasPermission(device)) {
        throw IllegalStateException("USB permission not granted for device $deviceId")
      }

      closeCurrentConnection()

      val connection = manager.openDevice(device)
        ?: throw IllegalStateException("Failed to open USB connection for device $deviceId")
      val port = driver.ports.firstOrNull()
        ?: throw IllegalStateException("Device $deviceId exposes no serial port")

      port.open(connection)
      port.setParameters(baudRate, UsbSerialPort.DATABITS_8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)
      runCatching { port.setDTR(false) }
      runCatching { port.setRTS(false) }

      val listener = object : SerialInputOutputManager.Listener {
        override fun onNewData(data: ByteArray) {
          sendEvent("onData", mapOf("bytes" to data))
        }

        override fun onRunError(e: Exception) {
          sendEvent("onError", mapOf("message" to (e.message ?: "Serial IO error")))
        }
      }
      val manager2 = SerialInputOutputManager(port, listener)
      manager2.start()

      currentPort = port
      currentDeviceId = deviceId
      ioManager = manager2
    }

    AsyncFunction("close") {
      closeCurrentConnection()
    }

    AsyncFunction("write") { bytes: ByteArray ->
      val port = currentPort ?: throw IllegalStateException("No open serial connection")
      port.write(bytes, WRITE_TIMEOUT_MS)
    }

    AsyncFunction("setBaudRate") { rate: Int ->
      val port = currentPort ?: throw IllegalStateException("No open serial connection")
      port.setParameters(rate, UsbSerialPort.DATABITS_8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)
    }

    AsyncFunction("setControlLines") { dtr: Boolean, rts: Boolean ->
      val port = currentPort ?: throw IllegalStateException("No open serial connection")
      runCatching { port.setDTR(dtr) }
      runCatching { port.setRTS(rts) }
      Unit
    }

    // esptool's board-reset sequences (classic DTR/RTS toggling, and the
    // USB-JTAG-Serial variant) are timing-sensitive: the chip samples its
    // GPIO0/EN strapping pins across a short pulse. Driving each toggle as
    // its own JS-to-native AsyncFunction call (as esptool-js's default
    // Transport-based ClassicReset/UsbJtagSerialReset do) adds unpredictable
    // bridge round-trip jitter between steps that a real browser's Web
    // Serial API doesn't have, which can be enough to miss the sample
    // window. Running the whole sequence here, in one call, keeps the
    // relative timing precise regardless of bridge overhead.
    AsyncFunction("classicReset") { resetDelayMs: Int ->
      val port = currentPort ?: throw IllegalStateException("No open serial connection")
      runCatching { port.setDTR(false) }
      runCatching { port.setRTS(true) }
      Thread.sleep(100)
      runCatching { port.setDTR(true) }
      runCatching { port.setRTS(false) }
      Thread.sleep(resetDelayMs.toLong())
      runCatching { port.setDTR(false) }
      Unit
    }

    AsyncFunction("usbJtagSerialReset") {
      val port = currentPort ?: throw IllegalStateException("No open serial connection")
      runCatching { port.setRTS(false) }
      runCatching { port.setDTR(false) }
      Thread.sleep(100)
      runCatching { port.setDTR(true) }
      runCatching { port.setRTS(false) }
      Thread.sleep(100)
      runCatching { port.setRTS(true) }
      runCatching { port.setDTR(false) }
      runCatching { port.setRTS(true) }
      Thread.sleep(100)
      runCatching { port.setRTS(false) }
      runCatching { port.setDTR(false) }
      Unit
    }
  }

  private fun closeCurrentConnection() {
    ioManager?.stop()
    ioManager = null
    currentPort?.let { runCatching { it.close() } }
    currentPort = null
    currentDeviceId = null
  }

  private fun deviceMap(driver: UsbSerialDriver): Map<String, Any?> {
    val device = driver.device
    return mapOf(
      "id" to device.deviceId,
      "vendorId" to device.vendorId,
      "productId" to device.productId,
      "deviceName" to (device.deviceName ?: "USB Device"),
      "driverType" to driver.javaClass.simpleName,
    )
  }

  private fun toDeviceRecord(driver: UsbSerialDriver): UsbDeviceRecord {
    val device = driver.device
    return UsbDeviceRecord().apply {
      id = device.deviceId
      vendorId = device.vendorId
      productId = device.productId
      deviceName = device.deviceName ?: "USB Device"
      driverType = driver.javaClass.simpleName
    }
  }

  private fun findDriver(manager: UsbManager, deviceId: Int): UsbSerialDriver? =
    UsbSerialProber.getDefaultProber().findAllDrivers(manager).firstOrNull { it.device.deviceId == deviceId }

  private fun findDevice(manager: UsbManager, deviceId: Int): UsbDevice? =
    manager.deviceList.values.firstOrNull { it.deviceId == deviceId }

  private fun requireUsbManager(): UsbManager =
    requireContext().getSystemService(Context.USB_SERVICE) as UsbManager

  private fun requireContext(): Context =
    appContext.reactContext ?: throw IllegalStateException("React context is not available")
}

import { Platform, PermissionsAndroid } from "react-native";
import type { ReceiptDocument } from "./receipt";
import { encodeEscPos } from "./receipt";

export type PrinterStatus = "idle" | "requesting-permission" | "discovering" | "connecting" | "ready" | "printing" | "completed" | "failed";
export type DiscoveredPrinter = { id: string; name: string };
export type ThermalPrinterController = { discover: () => Promise<DiscoveredPrinter[]>; connect: (deviceId: string, serviceUUID: string, characteristicUUID: string) => Promise<void>; print: (receipt: ReceiptDocument) => Promise<void>; disconnect: () => Promise<void>; status: () => PrinterStatus };

type BleDevice = { id: string; name?: string | null; localName?: string | null; connect: () => Promise<BleDevice>; discoverAllServicesAndCharacteristics: () => Promise<BleDevice>; writeCharacteristicWithoutResponseForService: (service: string, characteristic: string, value: string) => Promise<unknown>; cancelConnection: () => Promise<unknown> };
type BleManager = { startDeviceScan: (uuids: null, options: { allowDuplicates: boolean }, callback: (error: unknown, device: BleDevice | null) => void) => void; stopDeviceScan: () => void; connectToDevice: (id: string) => Promise<BleDevice>; destroy: () => void };

function base64(bytes: Uint8Array) { let binary = ""; const chunk = 0x8000; for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk)); return globalThis.btoa(binary); }
async function requestBluetoothPermission() { if (Platform.OS !== "android") return true; if (Number(Platform.Version) < 31) return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) === PermissionsAndroid.RESULTS.GRANTED; const result = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]); return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED && result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED; }

export function createBluetoothPrinter(onStatus: (status: PrinterStatus) => void): ThermalPrinterController {
  let manager: BleManager | null = null; let connected: BleDevice | null = null; let serviceUUID = ""; let characteristicUUID = ""; let current: PrinterStatus = "idle";
  const set = (status: PrinterStatus) => { current = status; onStatus(status); };
  const load = () => { if (Platform.OS === "web") throw new Error("bluetooth_not_available_on_web"); if (!manager) { const mod = require("react-native-ble-plx") as { BleManager: new () => BleManager }; manager = new mod.BleManager(); } return manager; };
  return {
    status: () => current,
    discover: async () => { set("requesting-permission"); if (!(await requestBluetoothPermission())) { set("failed"); throw new Error("bluetooth_permission_denied"); } const ble = load(); set("discovering"); const found = new Map<string, DiscoveredPrinter>(); return new Promise((resolve, reject) => { const timer = setTimeout(() => { ble.stopDeviceScan(); set("idle"); resolve([...found.values()]); }, 6500); ble.startDeviceScan(null, { allowDuplicates: false }, (error, device) => { if (error) { clearTimeout(timer); ble.stopDeviceScan(); set("failed"); reject(error); return; } if (device) found.set(device.id, { id: device.id, name: device.localName || device.name || "Bluetooth printer" }); }); }); },
    connect: async (deviceId, service, characteristic) => { set("connecting"); const ble = load(); serviceUUID = service; characteristicUUID = characteristic; connected = await ble.connectToDevice(deviceId); await connected.discoverAllServicesAndCharacteristics(); set("ready"); },
    print: async (receipt) => { if (!connected || !serviceUUID || !characteristicUUID) throw new Error("printer_not_connected"); set("printing"); try { const bytes = encodeEscPos(receipt); const chunkSize = 180; for (let offset = 0; offset < bytes.length; offset += chunkSize) await connected.writeCharacteristicWithoutResponseForService(serviceUUID, characteristicUUID, base64(bytes.subarray(offset, offset + chunkSize))); set("completed"); } catch (error) { set("failed"); throw error; } },
    disconnect: async () => { if (connected) await connected.cancelConnection(); connected = null; set("idle"); },
  };
}

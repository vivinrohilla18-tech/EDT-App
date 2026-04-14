import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const LIGHTS = [
  {key: 'R', label: 'Red', color: '#F44336', dark: '#5a1a1a'},
  {key: 'Y', label: 'Yellow', color: '#FFC107', dark: '#5a4a00'},
  {key: 'G', label: 'Green', color: '#4CAF50', dark: '#1a3a1a'},
];

const AUTO_TIMES = {R: 3000, Y: 1000, G: 3000};

export default function App() {
  const [connected, setConnected] = useState(false);
  const [activeDevice, setActiveDevice] = useState(null);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [activeLight, setActiveLight] = useState(null);
  const [autoMode, setAutoMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const autoRef = useRef(null);

  useEffect(() => { initBluetooth(); }, []);
  useEffect(() => { return () => clearInterval(autoRef.current); }, []);

  const initBluetooth = async () => {
    try {
      await requestPermissions();
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) await RNBluetoothClassic.requestBluetoothEnabled();
    } catch (e) {
      Alert.alert('Bluetooth Error', e.message);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return;
    if (Platform.Version >= 31) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    } else {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
  };

  const scanPairedDevices = async () => {
    setScanning(true);
    setPairedDevices([]);
    try {
      setPairedDevices(await RNBluetoothClassic.getBondedDevices());
    } catch (e) {
      Alert.alert('Scan Error', e.message);
    } finally {
      setScanning(false);
    }
  };

  const connectDevice = async dev => {
    try {
      const conn = await RNBluetoothClassic.connectToDevice(dev.address);
      setActiveDevice(conn);
      setConnected(true);
      setActiveLight(null);
      setAutoMode(false);
    } catch (e) {
      Alert.alert('Connection Failed', e.message);
    }
  };

  const sendCommand = async cmd => {
    if (!activeDevice || !connected) return;
    try { await activeDevice.write(cmd); }
    catch (e) { Alert.alert('Send Error', e.message); setConnected(false); }
  };

  const pressLight = async key => {
    stopAuto();
    setActiveLight(key);
    await sendCommand(key);
  };

  const pressAuto = async () => {
    setAutoMode(true);
    let step = 0;
    const keys = ['R', 'Y', 'G'];
    setActiveLight(keys[step]);
    await sendCommand('A');

    clearInterval(autoRef.current);
    const cycle = () => {
      step = (step + 1) % 3;
      setActiveLight(keys[step]);
    };
    autoRef.current = setInterval(cycle, AUTO_TIMES[keys[0]]);
  };

  const stopAuto = () => {
    setAutoMode(false);
    clearInterval(autoRef.current);
  };

  const pressOff = async () => {
    stopAuto();
    setActiveLight(null);
    await sendCommand('X');
  };

  const disconnect = async () => {
    stopAuto();
    try { if (activeDevice) await activeDevice.disconnect(); } catch (_) {}
    setActiveDevice(null);
    setConnected(false);
    setActiveLight(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d1a" />

      <View style={styles.header}>
        <Text style={styles.title}>EDT Traffic Light</Text>
        <Text style={styles.subtitle}>HC-05 Bluetooth</Text>
      </View>

      <View style={[styles.statusCard, connected ? styles.statusConnected : styles.statusDisconnected]}>
        <View style={[styles.dot, {backgroundColor: connected ? '#4CAF50' : '#F44336'}]} />
        <Text style={styles.statusText}>
          {connected ? `Connected to ${activeDevice?.name ?? 'device'}` : 'Not Connected'}
        </Text>
      </View>

      {connected ? (
        <View style={styles.panel}>
          {/* Traffic Light Visual */}
          <View style={styles.trafficBox}>
            {LIGHTS.map(l => (
              <View
                key={l.key}
                style={[
                  styles.lightCircle,
                  {backgroundColor: activeLight === l.key ? l.color : l.dark},
                  activeLight === l.key && {
                    shadowColor: l.color,
                    shadowOpacity: 0.8,
                    shadowRadius: 16,
                    elevation: 10,
                  },
                ]}
              />
            ))}
          </View>

          {/* Light Buttons */}
          {LIGHTS.map(l => (
            <TouchableOpacity
              key={l.key}
              style={[styles.btn, {backgroundColor: l.color}]}
              onPress={() => pressLight(l.key)}
              activeOpacity={0.8}>
              <Text style={styles.btnText}>{l.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Auto + Off */}
          <TouchableOpacity
            style={[styles.btn, styles.btnAuto, autoMode && styles.btnAutoActive]}
            onPress={pressAuto}
            activeOpacity={0.8}>
            <Text style={styles.btnText}>Auto Cycle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOff]}
            onPress={pressOff}
            activeOpacity={0.8}>
            <Text style={styles.btnText}>All OFF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnDisconnect]}
            onPress={disconnect}
            activeOpacity={0.8}>
            <Text style={styles.btnText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.panel}>
          <TouchableOpacity
            style={[styles.btn, styles.btnScan]}
            onPress={scanPairedDevices}
            activeOpacity={0.8}
            disabled={scanning}>
            {scanning ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Scan Paired Devices</Text>}
          </TouchableOpacity>

          <Text style={styles.listHeader}>{pairedDevices.length > 0 ? 'Tap a device to connect:' : ''}</Text>

          <FlatList
            data={pairedDevices}
            keyExtractor={item => item.address}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.deviceRow} onPress={() => connectDevice(item)} activeOpacity={0.7}>
                <View>
                  <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                  <Text style={styles.deviceAddr}>{item.address}</Text>
                </View>
                <Text style={styles.connectArrow}>{'\u203a'}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !scanning && (
                <Text style={styles.emptyText}>
                  {'No paired devices found.\n\nPair HC-05 in Android Bluetooth\nsettings first (PIN: 1234).'}
                </Text>
              )
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0d0d1a'},
  header: {alignItems: 'center', paddingTop: 50, paddingBottom: 20, backgroundColor: '#12122a', borderBottomWidth: 1, borderBottomColor: '#1e1e3f'},
  title: {fontSize: 22, fontWeight: 'bold', color: '#e94560', letterSpacing: 1},
  subtitle: {fontSize: 12, color: '#666', marginTop: 4, letterSpacing: 2},
  statusCard: {flexDirection: 'row', alignItems: 'center', margin: 16, padding: 14, borderRadius: 10, gap: 10},
  statusConnected: {backgroundColor: '#0a2a0a', borderWidth: 1, borderColor: '#2a6a2a'},
  statusDisconnected: {backgroundColor: '#2a0a0a', borderWidth: 1, borderColor: '#6a2a2a'},
  dot: {width: 10, height: 10, borderRadius: 5},
  statusText: {color: '#ccc', fontSize: 14},
  panel: {flex: 1, padding: 16},
  trafficBox: {
    alignSelf: 'center', backgroundColor: '#1a1a1a', borderRadius: 40, padding: 14,
    marginBottom: 24, gap: 10, borderWidth: 2, borderColor: '#333',
  },
  lightCircle: {width: 52, height: 52, borderRadius: 26},
  btn: {padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10},
  btnAuto: {backgroundColor: '#1565c0'},
  btnAutoActive: {backgroundColor: '#0d47a1', borderWidth: 2, borderColor: '#42a5f5'},
  btnOff: {backgroundColor: '#555'},
  btnDisconnect: {backgroundColor: '#333', marginTop: 6},
  btnScan: {backgroundColor: '#1565c0'},
  btnText: {color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5},
  listHeader: {color: '#888', fontSize: 13, marginBottom: 10},
  deviceRow: {backgroundColor: '#12122a', padding: 14, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e1e3f'},
  deviceName: {color: '#fff', fontSize: 15, fontWeight: '600'},
  deviceAddr: {color: '#555', fontSize: 11, marginTop: 2},
  connectArrow: {color: '#e94560', fontSize: 24, fontWeight: 'bold'},
  emptyText: {color: '#666', textAlign: 'center', marginTop: 40, lineHeight: 24, fontSize: 14},
});

import React, {useState, useEffect} from 'react';
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

export default function App() {
  const [connected, setConnected] = useState(false);
  const [activeDevice, setActiveDevice] = useState(null);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [ledOn, setLedOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [btEnabled, setBtEnabled] = useState(false);

  useEffect(() => {
    initBluetooth();
  }, []);

  const initBluetooth = async () => {
    try {
      await requestPermissions();
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      setBtEnabled(enabled);
      if (!enabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
        setBtEnabled(true);
      }
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
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
    }
  };

  const scanPairedDevices = async () => {
    setScanning(true);
    setPairedDevices([]);
    try {
      const devices = await RNBluetoothClassic.getBondedDevices();
      setPairedDevices(devices);
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
      setLedOn(false);
    } catch (e) {
      Alert.alert('Connection Failed', `Could not connect to ${dev.name}.\n\n${e.message}`);
    }
  };

  const sendCommand = async cmd => {
    if (!activeDevice || !connected) {
      Alert.alert('Not Connected', 'Please connect to HC-05 first.');
      return;
    }
    try {
      await activeDevice.write(cmd);
      setLedOn(cmd === '1');
    } catch (e) {
      Alert.alert('Send Error', e.message);
      setConnected(false);
    }
  };

  const disconnect = async () => {
    try {
      if (activeDevice) {
        await activeDevice.disconnect();
      }
    } catch (_) {}
    setActiveDevice(null);
    setConnected(false);
    setLedOn(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d1a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>EDT LED Controller</Text>
        <Text style={styles.subtitle}>HC-05 Bluetooth</Text>
      </View>

      {/* Connection Status */}
      <View style={[styles.statusCard, connected ? styles.statusConnected : styles.statusDisconnected]}>
        <View style={[styles.dot, {backgroundColor: connected ? '#4CAF50' : '#F44336'}]} />
        <Text style={styles.statusText}>
          {connected ? `Connected to ${activeDevice?.name ?? 'device'}` : 'Not Connected'}
        </Text>
      </View>

      {connected ? (
        /* ── CONTROL PANEL ── */
        <View style={styles.panel}>
          {/* LED Visual */}
          <View style={styles.ledCircleWrap}>
            <View style={[styles.ledCircle, ledOn ? styles.ledCircleOn : styles.ledCircleOff]}>
              <Text style={styles.ledLabel}>{ledOn ? 'ON' : 'OFF'}</Text>
            </View>
            <Text style={styles.ledCaption}>LED Status</Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.btn, styles.btnOn]}
            onPress={() => sendCommand('1')}
            activeOpacity={0.8}>
            <Text style={styles.btnText}>Turn ON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOff]}
            onPress={() => sendCommand('0')}
            activeOpacity={0.8}>
            <Text style={styles.btnText}>Turn OFF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnDisconnect]}
            onPress={disconnect}
            activeOpacity={0.8}>
            <Text style={styles.btnText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── SCAN PANEL ── */
        <View style={styles.panel}>
          <TouchableOpacity
            style={[styles.btn, styles.btnScan]}
            onPress={scanPairedDevices}
            activeOpacity={0.8}
            disabled={scanning}>
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Scan Paired Devices</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.listHeader}>
            {pairedDevices.length > 0 ? 'Tap a device to connect:' : ''}
          </Text>

          <FlatList
            data={pairedDevices}
            keyExtractor={item => item.address}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.deviceRow}
                onPress={() => connectDevice(item)}
                activeOpacity={0.7}>
                <View>
                  <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                  <Text style={styles.deviceAddr}>{item.address}</Text>
                </View>
                <Text style={styles.connectArrow}>›</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#12122a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e3f',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e94560',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    letterSpacing: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  statusConnected: {
    backgroundColor: '#0a2a0a',
    borderWidth: 1,
    borderColor: '#2a6a2a',
  },
  statusDisconnected: {
    backgroundColor: '#2a0a0a',
    borderWidth: 1,
    borderColor: '#6a2a2a',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: '#ccc',
    fontSize: 14,
  },
  panel: {
    flex: 1,
    padding: 16,
  },
  ledCircleWrap: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  ledCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  ledCircleOn: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  ledCircleOff: {
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
  },
  ledLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  ledCaption: {
    color: '#888',
    fontSize: 12,
  },
  btn: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnOn: {backgroundColor: '#2e7d32'},
  btnOff: {backgroundColor: '#c62828'},
  btnDisconnect: {backgroundColor: '#424242'},
  btnScan: {backgroundColor: '#1565c0'},
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listHeader: {
    color: '#888',
    fontSize: 13,
    marginBottom: 10,
  },
  deviceRow: {
    backgroundColor: '#12122a',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e3f',
  },
  deviceName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  deviceAddr: {
    color: '#555',
    fontSize: 11,
    marginTop: 2,
  },
  connectArrow: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 24,
    fontSize: 14,
  },
});

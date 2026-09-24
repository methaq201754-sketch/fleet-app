import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔗 رابط السيرفر الوسيط للمزامنة
const SYNC_API_URL = 'http://192.168.1.100:3000/api/sync';

type Role = 'user' | 'admin';

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  driverName: string;
  type: string;
  capacity: string;
  transportType: string;
  model: string;
  passengers: string;
  fuelType: string;
  status: 'في الخدمة' | 'موقف';
}

interface ServiceRequest {
  id: string;
  type: 'وقود' | 'زيوت' | 'إطارات' | 'بطاريات' | 'صيانة وقطع غيار';
  processNumber: string;
  date: string;
  quantity: string;
  allocation: string;
  station?: string;
  status: 'قيد المراجعة' | 'مرفوض' | 'تم الاعتماد';
  syncStatus: 'PENDING_PUSH' | 'SYNCED';
  vehicleId: string;
  driverName: string;
}

export default function App() {
  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('requests_status');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('لم تتم المزامنة بعد');

  const [userVehicle] = useState<Vehicle>({
    id: 'v1',
    name: 'شاحنة نقل جاف',
    plateNumber: '1234-أ',
    driverName: 'ميثاق عبده علي مقبل',
    type: 'شاحنة كبيرة',
    capacity: '15 طن',
    transportType: 'بضائع',
    model: '2022',
    passengers: '2',
    fuelType: 'ديزل',
    status: 'في الخدمة'
  });

  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  // 📥 قراءة البيانات من الهاتف فور تشغيل التطبيق
  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedSyncTime = await AsyncStorage.getItem('@last_sync_time');
      if (savedRequests) {
        setRequests(JSON.parse(savedRequests));
      } else {
        const defaultReqs: ServiceRequest[] = [
          {
            id: 'APP-1001',
            type: 'وقود',
            processNumber: 'TRX-1001',
            date: new Date().toISOString().split('T')[0],
            quantity: '100 لتر',
            allocation: 'رحلة تعز - عدن',
            station: 'محطة أطلس المركزية',
            status: 'تم الاعتماد',
            syncStatus: 'SYNCED',
            vehicleId: 'v1',
            driverName: 'ميثاق عبده علي مقبل'
          }
        ];
        setRequests(defaultReqs);
        await AsyncStorage.setItem('@fleet_requests', JSON.stringify(defaultReqs));
      }
      if (savedSyncTime) setLastSyncTime(savedSyncTime);
    } catch (e) {
      console.log('خطأ في تحميل البيانات المحلية', e);
    }
  };

  const saveRequestsLocally = async (newList: ServiceRequest[]) => {
    setRequests(newList);
    await AsyncStorage.setItem('@fleet_requests', JSON.stringify(newList));
  };

  const [newReqType, setNewReqType] = useState<any>('وقود');
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');

  // ➕ إنشاء طلب جديد وحفظه محلياً
  const handleCreateRequest = () => {
    if (!reqQuantity || !reqAllocation) {
      Alert.alert('خطأ', 'يرجى إكمال البيانات المطلوبة.');
      return;
    }

    const newReq: ServiceRequest = {
      id: `APP-${Date.now()}`,
      type: newReqType,
      processNumber: reqProcessNo || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      quantity: reqQuantity,
      allocation: reqAllocation,
      station: reqStation,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    saveRequestsLocally(updated);
    Alert.alert('تم الحفظ محلياً', 'تم حفظ الطلب في الهاتف. اضغط على (مزامنة مع Oracle) لرفعه.');
    setReqProcessNo('');
    setReqQuantity('');
    setReqAllocation('');
    setReqStation('');
  };

  // 🔄 إجراء المزامنة ثنائية الاتجاه
  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const pendingRequests = requests.filter(r => r.syncStatus === 'PENDING_PUSH');

      if (pendingRequests.length > 0) {
        const pushRes = await fetch(`${SYNC_API_URL}/push-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: pendingRequests }),
        });

        if (pushRes.ok) {
          const syncedList = requests.map(r =>
            r.syncStatus === 'PENDING_PUSH' ? { ...r, syncStatus: 'SYNCED' as const } : r
          );
          await saveRequestsLocally(syncedList);
        }
      }

      const pullRes = await fetch(`${SYNC_API_URL}/pull-updates?lastSync=${lastSyncTime}`);
      if (pullRes.ok) {
        const data = await pullRes.json();
        if (data.requests && data.requests.length > 0) {
          const updatedList = requests.map(req => {
            const match = data.requests.find((u: any) => u.app_request_id === req.id);
            return match ? { ...req, status: match.status } : req;
          });
          await saveRequestsLocally(updatedList);
        }
      }

      const now = new Date().toLocaleTimeString('ar-YE');
      setLastSyncTime(now);
      await AsyncStorage.setItem('@last_sync_time', now);
      Alert.alert('نجاح', 'تمت المزامنة بنجاح مع Oracle.');
    } catch (error) {
      Alert.alert('تنبيه', 'تعذر الاتصال بالسيرفر. البيانات محفوظة محلياً بالهاتف.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdminApproval = (reqId: string, status: 'تم الاعتماد' | 'مرفوض') => {
    const updated = requests.map((r) => (r.id === reqId ? { ...r, status } : r));
    saveRequestsLocally(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* شريط المزامنة العلوي */}
      <View style={styles.syncHeader}>
        <TouchableOpacity style={styles.syncBtn} onPress={triggerSync} disabled={isSyncing}>
          {isSyncing ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.syncBtnText}>🔄 مزامنة مع Oracle</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.syncTimeText}>آخر مزامنة: {lastSyncTime}</Text>
      </View>

      {/* الهيدر مع رقم الإصدار الجديد v1.0.7 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.roleSwitchBtn}
          onPress={() => setCurrentUserRole(currentUserRole === 'user' ? 'admin' : 'user')}
        >
          <Text style={styles.roleSwitchText}>
            التحويل: {currentUserRole === 'user' ? 'مسؤول' : 'مستخدم'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? 'السيارات - أطلس (v1.0.7)' : 'أطلس - إداري (v1.0.7)'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentUserRole === 'user' && (
          <>
            {currentTab === 'requests_status' && (
              <View>
                <Text style={styles.sectionTitle}>📋 قائمة طلباتي</Text>
                {requests.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>طلب {item.type}</Text>
                      <View style={[styles.badge, { backgroundColor: item.status === 'تم الاعتماد' ? '#4CAF50' : item.status === 'مرفوض' ? '#F44336' : '#FFC107' }]}>
                        <Text style={styles.badgeText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                    <Text style={styles.cardDetail}>الكمية: {item.quantity}</Text>
                    <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                    <Text style={{ fontSize: 11, color: item.syncStatus === 'SYNCED' ? '#2E7D32' : '#E65100', marginTop: 4, textAlign: 'right' }}>
                      {item.syncStatus === 'SYNCED' ? '☁️ متزامن مع Oracle' : '📱 مخزن محلياً (غير مرفوع)'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {currentTab === 'vehicle_info' && (
              <View>
                <View style={styles.customTitleRow}>
                  <TouchableOpacity onPress={() => setCurrentTab('requests_status')}>
                    <Text style={styles.largeBackArrow}>➔</Text>
                  </TouchableOpacity>
                  <Text style={styles.accordionHeader}>بيانات السيارة بالحساب</Text>
                </View>
                <View style={styles.accordionCard}>
                  <Text style={styles.accordionLabel}>اسم السيارة: {userVehicle.name}</Text>
                  <Text style={styles.accordionLabel}>رقم السيارة: {userVehicle.plateNumber}</Text>
                  <Text style={styles.accordionLabel}>اسم السائق: {userVehicle.driverName}</Text>
                  <Text style={styles.accordionLabel}>نوع السيارة: {userVehicle.type}</Text>
                  <Text style={styles.accordionLabel}>الحمولة: {userVehicle.capacity}</Text>
                  <Text style={styles.accordionLabel}>نوع النقل: {userVehicle.transportType}</Text>
                  <Text style={styles.accordionLabel}>الموديل: {userVehicle.model}</Text>
                  <Text style={styles.accordionLabel}>عدد الركاب: {userVehicle.passengers}</Text>
                  <Text style={styles.accordionLabel}>نوع الوقود: {userVehicle.fuelType}</Text>
                  <Text style={styles.accordionLabel}>حالة السيارة: {userVehicle.status}</Text>
                </View>
              </View>
            )}

            {currentTab === 'request_service' && (
              <View>
                <Text style={styles.sectionTitle}>🛠️ تقديم طلب خدمة</Text>
                <Text style={styles.inputLabel}>نوع الطلب:</Text>
                <View style={styles.rowTypes}>
                  {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, newReqType === t && styles.activeTypeChip]}
                      onPress={() => setNewReqType(t)}
                    >
                      <Text style={[styles.typeChipText, newReqType === t && styles.activeTypeChipText]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.inputLabel}>رقم العملية:</Text>
                <TextInput style={styles.input} placeholder="أدخل رقم العملية" value={reqProcessNo} onChangeText={setReqProcessNo} />
                <Text style={styles.inputLabel}>الكمية / التكلفة:</Text>
                <TextInput style={styles.input} placeholder="أدخل الكمية" value={reqQuantity} onChangeText={setReqQuantity} />
                <Text style={styles.inputLabel}>المخصص / الغرض:</Text>
                <TextInput style={styles.input} placeholder="أدخل المخصص" value={reqAllocation} onChangeText={setReqAllocation} />
                <Text style={styles.inputLabel}>المحطة / الورشة:</Text>
                <TextInput style={styles.input} placeholder="اسم المحطة" value={reqStation} onChangeText={setReqStation} />
                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRequest}>
                  <Text style={styles.submitBtnText}>حفظ الطلب بالهاتف</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {currentUserRole === 'admin' && (
          <View>
            <Text style={styles.sectionTitle}>🔔 طلبات الموظفين (الإدارة)</Text>
            {requests.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>طلب {item.type}</Text>
                <Text style={styles.cardDetail}>السائق: {item.driverName}</Text>
                <Text style={styles.cardDetail}>الحالة: {item.status}</Text>
                {item.status === 'قيد المراجعة' && (
                  <View style={styles.adminActionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleAdminApproval(item.id, 'تم الاعتماد')}>
                      <Text style={styles.actionBtnText}>موافقة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F44336' }]} onPress={() => handleAdminApproval(item.id, 'مرفوض')}>
                      <Text style={styles.actionBtnText}>رفض</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setCurrentTab('requests_status')}><Text style={styles.navText}>📋 طلباتي</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTab('request_service')}><Text style={styles.navText}>🛠️ طلب خدمة</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTab('vehicle_info')}><Text style={styles.navText}>🚗 بياناتي</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  syncHeader: { backgroundColor: '#1565C0', padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  syncBtn: { backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  syncBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  syncTimeText: { color: '#E3F2FD', fontSize: 11 },
  header: { backgroundColor: '#0D47A1', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  roleSwitchBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleSwitchText: { color: '#FFF', fontSize: 11 },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333', textAlign: 'right' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right' },
  cardDetail: { fontSize: 14, color: '#555', marginTop: 4, textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  customTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  largeBackArrow: { fontSize: 26, fontWeight: 'bold', color: '#0D47A1' },
  accordionHeader: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F' },
  accordionCard: { backgroundColor: '#EFEFEF', padding: 16, borderRadius: 12 },
  accordionLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginVertical: 4, textAlign: 'right' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#444', marginTop: 10, textAlign: 'right' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginTop: 4, textAlign: 'right' },
  rowTypes: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginVertical: 8 },
  typeChip: { backgroundColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, margin: 4 },
  activeTypeChip: { backgroundColor: '#0D47A1' },
  typeChipText: { color: '#333', fontSize: 12 },
  activeTypeChipText: { color: '#FFF' },
  submitBtn: { backgroundColor: '#0D47A1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  navBar: { flexDirection: 'row-reverse', justifyContent: 'space-around', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderColor: '#DDD' },
  navText: { fontSize: 13, fontWeight: 'bold', color: '#0D47A1' },
  adminActionRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold' }
});

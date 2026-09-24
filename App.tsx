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
  ActivityIndicator,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  priceAmount?: string;
  allocation: string;
  station?: string;
  notes?: string;
  status: 'قيد المراجعة' | 'مرفوض' | 'تم الاعتماد';
  syncStatus: 'PENDING_PUSH' | 'SYNCED';
  vehicleId: string;
  driverName: string;
}

export default function App() {
  // 🔒 حالة تسجيل الدخول
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>(''); // اسم المستخدم أو رقم السيارة
  const [loginPassword, setLoginPassword] = useState<string>(''); // كلمة المرور

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests');
  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<string>('وقود');
  const [reportSubTab, setReportSubTab] = useState<string>('وقود_مقبول');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('لم تتم المزامنة بعد');

  // 🚘 قائمة كافة سيارات الشركة المعتمدة في النظام
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([
    {
      id: 'v1',
      name: 'شاحنة نقل جاف 01',
      plateNumber: '1010-أ',
      driverName: 'ميثاق عبده علي مقبل',
      type: 'شاحنة كبيرة',
      capacity: '15 طن',
      transportType: 'بضائع',
      model: '2022',
      passengers: '2',
      fuelType: 'ديزل',
      status: 'في الخدمة'
    },
    {
      id: 'v2',
      name: 'دينا توزيع 02',
      plateNumber: '2020-ب',
      driverName: 'أحمد علي',
      type: 'متوسطة',
      capacity: '5 طن',
      transportType: 'منتجات طلاء',
      model: '2021',
      passengers: '3',
      fuelType: 'بنزين',
      status: 'في الخدمة'
    },
    {
      id: 'v3',
      name: 'قاطرة مواد خام 03',
      plateNumber: '3030-ج',
      driverName: 'سعيد حسن',
      type: 'قاطرة ثقيلة',
      capacity: '25 طن',
      transportType: 'خام',
      model: '2023',
      passengers: '2',
      fuelType: 'ديزل',
      status: 'في الخدمة'
    }
  ]);

  // السيارة الحالية المقترنة بالحساب المسجل
  const [userVehicle, setUserVehicle] = useState<Vehicle>(allVehicles[0]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  // 📝 مدخلات الطلبات
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('ديزل');
  const [reqNotes, setReqNotes] = useState('');

  // 🔑 كلمة المرور الحالية
  const [userPassword, setUserPassword] = useState('000');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedSyncTime = await AsyncStorage.getItem('@last_sync_time');
      const savedVehicles = await AsyncStorage.getItem('@all_vehicles');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedVehicles) setAllVehicles(JSON.parse(savedVehicles));
      if (savedSyncTime) setLastSyncTime(savedSyncTime);
    } catch (e) {
      console.log('خطأ قراءة البيانات', e);
    }
  };

  const saveRequestsLocally = async (newList: ServiceRequest[]) => {
    setRequests(newList);
    await AsyncStorage.setItem('@fleet_requests', JSON.stringify(newList));
  };

  // 🔐 دالة تسجيل الدخول
  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم أو رقم السيارة');
      return;
    }

    // كلمة المرور الافتراضية للجميع هي 000
    if (loginPassword !== '000' && loginPassword !== userPassword) {
      Alert.alert('خطأ في كلمة المرور', 'كلمة المرور غير صحيحة. كلمة المرور الافتراضية هي: 000');
      return;
    }

    // حساب المسؤول
    if (loginUsername.trim() === 'admin' || loginUsername.trim() === 'المسؤول') {
      setCurrentUserRole('admin');
      setIsLoggedIn(true);
      setCurrentTab('admin_requests');
      Alert.alert('مرحباً بك', 'تم تسجيل الدخول كمسؤول النظام');
      return;
    }

    // حساب سائق/سيارة
    const foundVehicle = allVehicles.find(
      (v) =>
        v.plateNumber.includes(loginUsername.trim()) ||
        v.driverName.includes(loginUsername.trim()) ||
        v.name.includes(loginUsername.trim())
    );

    if (foundVehicle) {
      setUserVehicle(foundVehicle);
      setCurrentUserRole('user');
      setIsLoggedIn(true);
      setCurrentTab('my_requests');
      Alert.alert('تم الدخول بنجاح', `مرحباً بك: ${foundVehicle.driverName} (${foundVehicle.name})`);
    } else {
      // إتاحة الدخول بالبيانات المدخلة في حال لم توجد الشاحنة باللائحة
      const tempVeh: Vehicle = {
        id: `v_${Date.now()}`,
        name: 'سيارة الحركة',
        plateNumber: loginUsername,
        driverName: loginUsername,
        type: 'شاحنة',
        capacity: '10 طن',
        transportType: 'عام',
        model: '2022',
        passengers: '2',
        fuelType: 'ديزل',
        status: 'في الخدمة'
      };
      setUserVehicle(tempVeh);
      setCurrentUserRole('user');
      setIsLoggedIn(true);
      setCurrentTab('my_requests');
    }
  };

  // 🚪 تسجيل الخروج
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
    Alert.alert('تم', 'تم تسجيل الخروج بنجاح.');
  };

  // 🛠️ تقديم طلب خدمة
  const handleCreateRequest = (type: any) => {
    if (userVehicle.status === 'موقف') {
      Alert.alert('تنبيه خطأ', 'تم إيقاف هذه السيارة من قبل الإدارة. لا يمكن تقديم أي طلبات.');
      return;
    }

    if (!reqQuantity || !reqAllocation) {
      Alert.alert('خطأ', 'يرجى إكمال الكمية والمخصص');
      return;
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const newReq: ServiceRequest = {
      id: `APP-${Date.now()}`,
      type: type,
      processNumber: reqProcessNo || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: todayDate,
      quantity: reqQuantity,
      priceAmount: reqPriceAmount || '0',
      allocation: reqAllocation,
      station: reqStation || 'المحطة المعتمدة',
      notes: reqNotes,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    saveRequestsLocally(updated);

    Alert.alert('🔔 إشعار فوق الشاشة', `تم إرسال طلب ${type} جديد بنجاح وهو قيد المراجعة.`);

    setReqProcessNo('');
    setReqQuantity('');
    setReqPriceAmount('');
    setReqAllocation('');
    setReqStation('');
    setReqNotes('');
  };

  // 🔄 المزامنة
  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const pendingRequests = requests.filter((r) => r.syncStatus === 'PENDING_PUSH');

      if (pendingRequests.length > 0) {
        await fetch(`${SYNC_API_URL}/push-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: pendingRequests }),
        });
      }

      const now = new Date().toLocaleTimeString('ar-YE');
      setLastSyncTime(now);
      Alert.alert('نجاح', 'تمت المزامنة بنجاح مع Oracle.');
    } catch (error) {
      Alert.alert('تنبيه', 'تم الحفظ محلياً. تعذر الاتصال بالسيرفر حالياً.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 🔓 شاشة تسجيل الدخول إذا لم يكن مسجلاً
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>تطبيق السيارات - أطلس</Text>
          <Text style={styles.loginSubtitle}>تسجيل الدخول للنظام (v1.0.9)</Text>

          <Text style={styles.inputLabel}>رقم السيارة / اسم المستخدم:</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل رقم السيارة أو اسم السائق"
            value={loginUsername}
            onChangeText={setLoginUsername}
          />

          <Text style={styles.inputLabel}>كلمة المرور (الافتراضية 000):</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل كلمة المرور"
            secureTextEntry
            value={loginPassword}
            onChangeText={setLoginPassword}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
            <Text style={styles.submitBtnText}>تسجيل الدخول 🔑</Text>
          </TouchableOpacity>

          <Text style={styles.hintText}>* كلمة المرور الافتراضية لجميع السائقين هي: 000</Text>
          <Text style={styles.hintText}>* للدخول كمسؤول أدخل: admin في اسم المستخدم</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* شريط المزامنة */}
      <View style={styles.syncHeader}>
        <TouchableOpacity style={styles.syncBtn} onPress={triggerSync} disabled={isSyncing}>
          {isSyncing ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.syncBtnText}>🔄 مزامنة Oracle</Text>}
        </TouchableOpacity>
        <Text style={styles.syncTimeText}>آخر مزامنة: {lastSyncTime}</Text>
      </View>

      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutTopBtn} onPress={handleLogout}>
          <Text style={styles.logoutTopText}>خروج 🚪</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? `السيارات (${userVehicle.plateNumber})` : 'أطلس - إداري (v1.0.9)'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ==================== 👤 حساب المستخدم ==================== */}
        {currentUserRole === 'user' && (
          <>
            {/* 1️⃣ أيقونة وقائمة "طلباتي" */}
            {currentTab === 'my_requests' && (
              <View>
                <Text style={styles.sectionTitle}>📋 قائمة طلباتي</Text>
                
                <View style={styles.subTabRow}>
                  {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.subTabBtn, myRequestsSubTab === cat && styles.activeSubTabBtn]}
                      onPress={() => setMyRequestsSubTab(cat)}
                    >
                      <Text style={[styles.subTabBtnText, myRequestsSubTab === cat && styles.activeSubTabBtnText]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {requests.filter(r => r.type === myRequestsSubTab).length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد طلبات في قسم ({myRequestsSubTab})</Text>
                ) : (
                  requests.filter(r => r.type === myRequestsSubTab).map((item) => (
                    <View key={item.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>طلب {item.type}</Text>
                        <View style={[styles.badge, {
                          backgroundColor: item.status === 'تم الاعتماد' ? '#4CAF50' : item.status === 'مرفوض' ? '#F44336' : '#FF9800'
                        }]}>
                          <Text style={styles.badgeText}>{item.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                      <Text style={styles.cardDetail}>التاريخ: {item.date}</Text>
                      <Text style={styles.cardDetail}>الكمية / التكلفة: {item.quantity}</Text>
                      <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 2️⃣ شاشة بيانات السيارة المسجلة بالحساب */}
            {currentTab === 'vehicle_info' && (
              <View>
                <View style={styles.customTitleRow}>
                  <TouchableOpacity onPress={() => setCurrentTab('my_requests')}>
                    <Text style={styles.largeBackArrow}>➔</Text>
                  </TouchableOpacity>
                  <Text style={styles.accordionHeader}>بيانات السيارة المسجلة بالحساب</Text>
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
                  <Text style={[styles.accordionLabel, { color: userVehicle.status === 'في الخدمة' ? '#2E7D32' : '#D32F2F', fontWeight: 'bold' }]}>
                    حالة السيارة: {userVehicle.status}
                  </Text>
                </View>
              </View>
            )}

            {/* 7️⃣ شاشة طلب خدمة */}
            {currentTab === 'request_service' && (
              <View>
                <Text style={styles.sectionTitle}>🛠️ شاشة طلب خدمة</Text>

                <View style={styles.subTabRow}>
                  {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.subTabBtn, serviceSubTab === cat && styles.activeSubTabBtn]}
                      onPress={() => setServiceSubTab(cat)}
                    >
                      <Text style={[styles.subTabBtnText, serviceSubTab === cat && styles.activeSubTabBtnText]}>
                        طلب {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.inputLabel}>التاريخ تلقائي:</Text>
                  <TextInput style={[styles.input, { backgroundColor: '#E0E0E0' }]} value={new Date().toISOString().split('T')[0]} editable={false} />

                  {serviceSubTab === 'وقود' && (
                    <>
                      <Text style={styles.inputLabel}>نوع الوقود:</Text>
                      <TextInput style={styles.input} value={reqFuelType} onChangeText={setReqFuelType} />
                    </>
                  )}

                  <Text style={styles.inputLabel}>الكمية (باللتر / العدد):</Text>
                  <TextInput style={styles.input} placeholder="أدخل الكمية" value={reqQuantity} onChangeText={setReqQuantity} keyboardType="numeric" />

                  <Text style={styles.inputLabel}>المخصص / الغرض:</Text>
                  <TextInput style={styles.input} placeholder="مثال: رحلة تعز - عدن" value={reqAllocation} onChangeText={setReqAllocation} />

                  <Text style={styles.inputLabel}>المحطة / الورشة:</Text>
                  <TextInput style={styles.input} placeholder="اسم المحطة أو الورشة" value={reqStation} onChangeText={setReqStation} />

                  <Text style={styles.inputLabel}>رقم العملية:</Text>
                  <TextInput style={styles.input} placeholder="أدخل رقم العملية" value={reqProcessNo} onChangeText={setReqProcessNo} />

                  <TouchableOpacity style={styles.submitBtn} onPress={() => handleCreateRequest(serviceSubTab)}>
                    <Text style={styles.submitBtnText}>إرسال طلب {serviceSubTab}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 5️⃣ شاشة التقارير للمستخدم */}
            {currentTab === 'reports' && (
              <View>
                <Text style={styles.sectionTitle}>📊 تقارير المصروفات والخدمات</Text>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>تقرير وقود السيارة ({userVehicle.plateNumber})</Text>
                  <Text style={styles.cardDetail}>الإجمالي باللتر: 250 لتر</Text>
                  <Text style={styles.cardDetail}>الإجمالي بالقيمة: 125,000 ريال</Text>
                </View>
              </View>
            )}

            {/* 3️⃣ شاشة الإعدادات */}
            {currentTab === 'settings' && (
              <View>
                <Text style={styles.sectionTitle}>⚙️ إعدادات الحساب</Text>
                <View style={styles.card}>
                  <Text style={styles.inputLabel}>اسم السيارة: {userVehicle.name}</Text>
                  <Text style={styles.inputLabel}>رقم السيارة: {userVehicle.plateNumber}</Text>
                  <Text style={styles.inputLabel}>اسم السائق: {userVehicle.driverName}</Text>

                  <Text style={[styles.inputLabel, { marginTop: 15 }]}>تغيير كلمة المرور (الافتراضية 000):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="أدخل كلمة المرور الجديدة"
                    secureTextEntry
                    value={newPasswordInput}
                    onChangeText={setNewPasswordInput}
                  />
                  <TouchableOpacity style={styles.submitBtn} onPress={() => { setUserPassword(newPasswordInput); Alert.alert('تم', 'تم تغيير كلمة المرور'); }}>
                    <Text style={styles.submitBtnText}>حفظ كلمة المرور</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#D32F2F', marginTop: 20 }]} onPress={handleLogout}>
                  <Text style={styles.submitBtnText}>🚪 تسجيل الخروج</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ==================== 👑 حساب المسؤول ==================== */}
        {currentUserRole === 'admin' && (
          <View>
            <Text style={styles.sectionTitle}>🔔 طلبات الموظفين والسيارات</Text>
            {requests.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>طلب {item.type} - {item.driverName}</Text>
                <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                <Text style={styles.cardDetail}>الكمية: {item.quantity} | المخصص: {item.allocation}</Text>
                <Text style={styles.cardDetail}>الحالة: {item.status}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* الشريط السفلي */}
      <View style={styles.navBar}>
        {currentUserRole === 'user' && (
          <>
            <TouchableOpacity onPress={() => setCurrentTab('my_requests')}>
              <Text style={styles.navText}>📋 طلباتي</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('request_service')}>
              <Text style={styles.navText}>🛠️ طلب خدمة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('vehicle_info')}>
              <Text style={styles.navText}>🚗 بيانات السيارة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('reports')}>
              <Text style={styles.navText}>📊 التقارير</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('settings')}>
              <Text style={styles.navText}>⚙️ الإعدادات</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#0D47A1', justifyContent: 'center', padding: 20 },
  loginCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 5 },
  loginTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D47A1', textAlign: 'center' },
  loginSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  hintText: { fontSize: 11, color: '#D32F2F', marginTop: 8, textAlign: 'center' },
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  syncHeader: { backgroundColor: '#1565C0', padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  syncBtn: { backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  syncBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  syncTimeText: { color: '#E3F2FD', fontSize: 11 },
  header: { backgroundColor: '#0D47A1', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  logoutTopBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  logoutTopText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 12, color: '#1A237E', textAlign: 'right' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right' },
  cardDetail: { fontSize: 13, color: '#444', marginTop: 4, textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  customTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  largeBackArrow: { fontSize: 26, fontWeight: 'bold', color: '#0D47A1' },
  accordionHeader: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  accordionCard: { backgroundColor: '#EFEFEF', padding: 16, borderRadius: 12 },
  accordionLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginVertical: 4, textAlign: 'right' },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#444', marginTop: 8, textAlign: 'right' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 8, marginTop: 4, textAlign: 'right' },
  subTabRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 10 },
  subTabBtn: { backgroundColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, margin: 3 },
  activeSubTabBtn: { backgroundColor: '#0D47A1' },
  subTabBtnText: { color: '#333', fontSize: 12 },
  activeSubTabBtnText: { color: '#FFF', fontWeight: 'bold' },
  formCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 10 },
  submitBtn: { backgroundColor: '#0D47A1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  navBar: { flexDirection: 'row-reverse', justifyContent: 'space-around', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderColor: '#DDD' },
  navText: { fontSize: 11, fontWeight: 'bold', color: '#0D47A1' },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20 }
});

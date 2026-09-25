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

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
}

interface VehiclePermission {
  canRequestFuel: boolean;
  canRequestOils: boolean;
  canRequestTires: boolean;
  canRequestBatteries: boolean;
  canRequestMaintenance: boolean;
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
  fuelType?: string;
  notes?: string;
  status: 'قيد المراجعة' | 'مرفوض' | 'تم الاعتماد';
  syncStatus: 'PENDING_PUSH' | 'SYNCED';
  vehicleId: string;
  driverName: string;
}

// واجهة عناصر التكويد
interface CodeCategories {
  spareParts: string[];
  oils: string[];
  allocations: string[];
  batteries: string[];
  stations: string[];
  tires: string[];
  fuelTypes: string[];
}

export default function App() {
  // 🔒 حالة تسجيل الدخول
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests');

  // التبويبات الفرعية
  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<string>('وقود');
  const [codingSubTab, setCodingSubTab] = useState<string>('stations');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('لم تتم المزامنة بعد');

  // 🚘 قائمة كافة السيارات
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
    }
  ]);

  // 👨‍✈️ قائمة السائقين
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 'd1', name: 'ميثاق عبده علي مقبل', phone: '770000000', licenseNo: 'L-101' },
    { id: 'd2', name: 'أحمد علي', phone: '771111111', licenseNo: 'L-102' }
  ]);

  // 🔑 صلاحيات السيارات (لكل سيارة صلاحيتها الخاصة)
  const [vehiclePermissions, setVehiclePermissions] = useState<Record<string, VehiclePermission>>({
    v1: { canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true },
    v2: { canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true }
  });
  const [selectedVehForPerms, setSelectedVehForPerms] = useState<string>('v1');

  // 🏷️ شاشة التكويد (بيانات القوائم المنسدلة)
  const [codes, setCodes] = useState<CodeCategories>({
    spareParts: ['فلاتر', 'سير محرك', 'قماشات فرامل'],
    oils: ['زيت محرك 20W50', 'زيت هيدروليك', 'زيت جير'],
    allocations: ['رحلة تعز - عدن', 'توزيع محلي', 'حركة مصنع'],
    batteries: ['بطارية 70 أمبير', 'بطارية 100 أمبير'],
    stations: ['محطة الزبيدي', 'محطة الشركة', 'محطة الأمل'],
    tires: ['إطار 22.5', 'إطار 16'],
    fuelTypes: ['ديزل', 'بنزين ممتاز', 'بنزين عادي']
  });

  const [newCodeInput, setNewCodeInput] = useState<string>('');

  // السيارة الحالية للمستخدم
  const [userVehicle, setUserVehicle] = useState<Vehicle>(allVehicles[0]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  // 📝 مدخلات شاشة طلب خدمة
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('ديزل');
  const [reqNotes, setReqNotes] = useState('');

  // ⚙️ إعدادات الحساب وتغيير البيانات
  const [userPassword, setUserPassword] = useState('000');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [editingField, setEditingField] = useState<'name' | 'plate' | 'driver' | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editPlateValue, setEditPlateValue] = useState('');
  const [editDriverValue, setEditDriverValue] = useState('');

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedSyncTime = await AsyncStorage.getItem('@last_sync_time');
      const savedVehicles = await AsyncStorage.getItem('@all_vehicles');
      const savedDrivers = await AsyncStorage.getItem('@all_drivers');
      const savedPerms = await AsyncStorage.getItem('@vehicle_permissions');
      const savedCodes = await AsyncStorage.getItem('@fleet_codes');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedVehicles) setAllVehicles(JSON.parse(savedVehicles));
      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
      if (savedPerms) setVehiclePermissions(JSON.parse(savedPerms));
      if (savedCodes) setCodes(JSON.parse(savedCodes));
      if (savedSyncTime) setLastSyncTime(savedSyncTime);
    } catch (e) {
      console.log('خطأ قراءة البيانات', e);
    }
  };

  const saveRequestsLocally = async (newList: ServiceRequest[]) => {
    setRequests(newList);
    await AsyncStorage.setItem('@fleet_requests', JSON.stringify(newList));
  };

  const saveVehiclesLocally = async (newList: Vehicle[]) => {
    setAllVehicles(newList);
    await AsyncStorage.setItem('@all_vehicles', JSON.stringify(newList));
  };

  const saveCodesLocally = async (newCodes: CodeCategories) => {
    setCodes(newCodes);
    await AsyncStorage.setItem('@fleet_codes', JSON.stringify(newCodes));
  };

  // 🔐 تسجيل الدخول
  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم أو رقم السيارة');
      return;
    }

    if (loginPassword !== '000' && loginPassword !== userPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة.');
      return;
    }

    if (loginUsername.trim() === 'admin' || loginUsername.trim() === 'المسؤول') {
      setCurrentUserRole('admin');
      setIsLoggedIn(true);
      setCurrentTab('admin_requests');
      return;
    }

    const foundVehicle = allVehicles.find(
      (v) =>
        v.plateNumber.includes(loginUsername.trim()) ||
        v.driverName.includes(loginUsername.trim()) ||
        v.name.includes(loginUsername.trim())
    );

    if (foundVehicle) {
      setUserVehicle(foundVehicle);
      setEditNameValue(foundVehicle.name);
      setEditPlateValue(foundVehicle.plateNumber);
      setEditDriverValue(foundVehicle.driverName);
    } else {
      const tempVeh: Vehicle = {
        id: `v_${Date.now()}`,
        name: 'سيارة الحركة',
        plateNumber: loginUsername,
        driverName: loginUsername,
        type: 'شاحنة',
        capacity: '10 طن',
        transportType: 'عام',
        model: '2023',
        passengers: '2',
        fuelType: 'ديزل',
        status: 'في الخدمة'
      };
      setUserVehicle(tempVeh);
      setEditNameValue(tempVeh.name);
      setEditPlateValue(tempVeh.plateNumber);
      setEditDriverValue(tempVeh.driverName);
    }

    setCurrentUserRole('user');
    setIsLoggedIn(true);
    setCurrentTab('my_requests');
  };

  // 🚪 تسجيل الخروج
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  // 🛠️ تقديم طلب خدمة
  const handleCreateRequest = (type: any) => {
    if (userVehicle.status === 'موقف') {
      Alert.alert('تنبيه', 'تم إيقاف هذه السيارة من قبل الإدارة. لا يمكن تقديم أي طلبات مصروفات.');
      return;
    }

    const currentPerms = vehiclePermissions[userVehicle.id] || {
      canRequestFuel: true,
      canRequestOils: true,
      canRequestTires: true,
      canRequestBatteries: true,
      canRequestMaintenance: true
    };

    if (type === 'وقود' && !currentPerms.canRequestFuel) { Alert.alert('تنبيه', 'تم حظر صلاحية طلب الوقود لهذه السيارة.'); return; }
    if (type === 'زيوت' && !currentPerms.canRequestOils) { Alert.alert('تنبيه', 'تم حظر صلاحية طلب الزيوت لهذه السيارة.'); return; }
    if (type === 'إطارات' && !currentPerms.canRequestTires) { Alert.alert('تنبيه', 'تم حظر صلاحية طلب الإطارات لهذه السيارة.'); return; }
    if (type === 'بطاريات' && !currentPerms.canRequestBatteries) { Alert.alert('تنبيه', 'تم حظر صلاحية طلب البطاريات لهذه السيارة.'); return; }
    if (type === 'صيانة وقطع غيار' && !currentPerms.canRequestMaintenance) { Alert.alert('تنبيه', 'تم حظر صلاحية طلب الصيانة لهذه السيارة.'); return; }

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
      station: reqStation || codes.stations[0] || 'المحطة المعتمدة',
      fuelType: reqFuelType || codes.fuelTypes[0] || 'ديزل',
      notes: reqNotes,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    saveRequestsLocally(updated);

    Alert.alert('تم الإرسال', `تم إرسال طلب ${type} بنجاح وهو قيد المراجعة.`);

    setReqProcessNo('');
    setReqQuantity('');
    setReqPriceAmount('');
    setReqAllocation('');
    setReqStation('');
    setReqNotes('');
  };

  // 🏷️ إضافة عنصر تكويد جديد (خاص بالمسؤول)
  const handleAddCodeItem = (category: keyof CodeCategories) => {
    if (!newCodeInput.trim()) return;
    const updatedCategory = [...codes[category], newCodeInput.trim()];
    const newCodes = { ...codes, [category]: updatedCategory };
    saveCodesLocally(newCodes);
    setNewCodeInput('');
    Alert.alert('تم', 'تم إضافة العنصر بنجاح والتحديث في القوائم المنسدلة.');
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
      Alert.alert('نجاح', 'تمت المزامنة بنجاح مع سيرفر Oracle.');
    } catch (error) {
      Alert.alert('تنبيه', 'تم الحفظ محلياً. تعذر الاتصال بالسيرفر حالياً.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 🔓 شاشة تسجيل الدخول
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>تطبيق السيارات - أطلس</Text>
          <Text style={styles.loginSubtitle}>تسجيل الدخول للنظام (v1.2.0)</Text>

          <Text style={styles.inputLabel}>رقم السيارة / اسم المستخدم:</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل رقم السيارة أو اسم السائق"
            value={loginUsername}
            onChangeText={setLoginUsername}
          />

          <Text style={styles.inputLabel}>كلمة المرور:</Text>
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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* شريط المزامنة العلوي */}
      <View style={styles.syncHeader}>
        <TouchableOpacity style={styles.syncBtn} onPress={triggerSync} disabled={isSyncing}>
          {isSyncing ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.syncBtnText}>🔄 مزامنة Oracle</Text>}
        </TouchableOpacity>
        <Text style={styles.syncTimeText}>آخر مزامنة: {lastSyncTime}</Text>
      </View>

      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? `السيارة (${userVehicle.plateNumber})` : 'أطلس - لوحة المسؤول'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ==================== 👤 حساب المستخدم ==================== */}
        {currentUserRole === 'user' && (
          <>
            {/* 1️⃣ أيقونة وقائمة "طلباتي" الموزعة بالتفصيل */}
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
                        طلبات {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {requests.filter(r => (r.vehicleId === userVehicle.id || r.driverName === userVehicle.driverName) && r.type === myRequestsSubTab).length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد طلبات في قسم (طلبات {myRequestsSubTab})</Text>
                ) : (
                  requests.filter(r => (r.vehicleId === userVehicle.id || r.driverName === userVehicle.driverName) && r.type === myRequestsSubTab).map((item) => (
                    <View key={item.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>طلب {item.type}</Text>
                        <View style={[styles.badge, {
                          backgroundColor: item.status === 'تم الاعتماد' ? '#2E7D32' : item.status === 'مرفوض' ? '#D32F2F' : '#EF6C00'
                        }]}>
                          <Text style={styles.badgeText}>{item.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                      <Text style={styles.cardDetail}>التاريخ: {item.date}</Text>
                      <Text style={styles.cardDetail}>الكمية: {item.quantity}</Text>
                      <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                      <Text style={styles.cardDetail}>المحطة / الورشة: {item.station}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 2️⃣ شاشة بيانات السيارة المسجلة بالحساب فقط */}
            {currentTab === 'vehicle_info' && (
              <View>
                <Text style={styles.sectionTitle}>🚘 بيانات السيارة المسجلة بالحساب</Text>

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

            {/* شاشة طلب خدمة المحدثة مع القوائم المنسدلة */}
            {currentTab === 'request_service' && (
              <View>
                <Text style={styles.sectionTitle}>🛠️ شاشة تقديم طلب خدمة</Text>

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

                  {/* قائمة منسدلة لأنواع الوقود */}
                  {serviceSubTab === 'وقود' && (
                    <>
                      <Text style={styles.inputLabel}>اختر نوع الوقود (قائمة منسدلة):</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                        {codes.fuelTypes.map((ft) => (
                          <TouchableOpacity
                            key={ft}
                            style={[styles.chipBtn, reqFuelType === ft && styles.chipBtnActive]}
                            onPress={() => setReqFuelType(ft)}
                          >
                            <Text style={[styles.chipText, reqFuelType === ft && styles.chipTextActive]}>{ft}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {/* قائمة منسدلة للمحطات */}
                  <Text style={styles.inputLabel}>اختر اسم المحطة / الورشة (قائمة منسدلة):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    {codes.stations.map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.chipBtn, reqStation === st && styles.chipBtnActive]}
                        onPress={() => setReqStation(st)}
                      >
                        <Text style={[styles.chipText, reqStation === st && styles.chipTextActive]}>{st}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* قائمة منسدلة للمخصصات */}
                  <Text style={styles.inputLabel}>اختر المخصص (قائمة منسدلة):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    {codes.allocations.map((al) => (
                      <TouchableOpacity
                        key={al}
                        style={[styles.chipBtn, reqAllocation === al && styles.chipBtnActive]}
                        onPress={() => setReqAllocation(al)}
                      >
                        <Text style={[styles.chipText, reqAllocation === al && styles.chipTextActive]}>{al}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.inputLabel}>الكمية (باللتر / العدد):</Text>
                  <TextInput style={styles.input} placeholder="أدخل الكمية" value={reqQuantity} onChangeText={setReqQuantity} keyboardType="numeric" />

                  <Text style={styles.inputLabel}>رقم العملية:</Text>
                  <TextInput style={styles.input} placeholder="أدخل رقم العملية" value={reqProcessNo} onChangeText={setReqProcessNo} />

                  <TouchableOpacity style={styles.submitBtn} onPress={() => handleCreateRequest(serviceSubTab)}>
                    <Text style={styles.submitBtnText}>إرسال طلب {serviceSubTab}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 3️⃣ شاشة الإعدادات للمستخدم مجهزة بأقلام التعديل */}
            {currentTab === 'settings' && (
              <View>
                <Text style={styles.sectionTitle}>⚙️ إعدادات الحساب</Text>
                <View style={styles.card}>
                  
                  {/* اسم السيارة مع قلم التعديل ✏️ */}
                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>اسم السيارة: {userVehicle.name}</Text>
                    <TouchableOpacity onPress={() => setEditingField('name')}>
                      <Text style={styles.penIcon}>✏️ تعديل</Text>
                    </TouchableOpacity>
                  </View>

                  {/* رقم السيارة مع قلم التعديل ✏️ */}
                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>رقم السيارة: {userVehicle.plateNumber}</Text>
                    <TouchableOpacity onPress={() => setEditingField('plate')}>
                      <Text style={styles.penIcon}>✏️ تعديل</Text>
                    </TouchableOpacity>
                  </View>

                  {/* اسم السائق مع قلم التعديل ✏️ */}
                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>اسم السائق: {userVehicle.driverName}</Text>
                    <TouchableOpacity onPress={() => setEditingField('driver')}>
                      <Text style={styles.penIcon}>✏️ تعديل</Text>
                    </TouchableOpacity>
                  </View>

                  {/* في حال الضغط على قلم التعديل */}
                  {editingField !== null && (
                    <View style={styles.inlineEditBox}>
                      <Text style={styles.inputLabel}>
                        {editingField === 'name' ? 'تعديل اسم السيارة:' : editingField === 'plate' ? 'تعديل رقم السيارة:' : 'تعديل اسم السائق:'}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={editingField === 'name' ? editNameValue : editingField === 'plate' ? editPlateValue : editDriverValue}
                        onChangeText={(txt) => {
                          if (editingField === 'name') setEditNameValue(txt);
                          if (editingField === 'plate') setEditPlateValue(txt);
                          if (editingField === 'driver') setEditDriverValue(txt);
                        }}
                      />
                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#2E7D32', marginTop: 8 }]}
                        onPress={() => {
                          const updated = {
                            ...userVehicle,
                            name: editNameValue,
                            plateNumber: editPlateValue,
                            driverName: editDriverValue
                          };
                          setUserVehicle(updated);
                          setEditingField(null);
                          Alert.alert('تم', 'تم حفظ التعديل بنجاح.');
                        }}
                      >
                        <Text style={styles.submitBtnText}>حفظ التعديل</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={{ height: 1, backgroundColor: '#DDD', marginVertical: 15 }} />

                  {/* تغيير كلمة المرور للمستخدم */}
                  <Text style={styles.inputLabel}>تغيير كلمة المرور الخاصة بالمستخدم:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="أدخل كلمة المرور الجديدة"
                    secureTextEntry
                    value={newPasswordInput}
                    onChangeText={setNewPasswordInput}
                  />
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => {
                      if (!newPasswordInput) return;
                      setUserPassword(newPasswordInput);
                      setNewPasswordInput('');
                      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح.');
                    }}
                  >
                    <Text style={styles.submitBtnText}>حفظ كلمة المرور الجديدة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ==================== 👑 حساب المسؤول ==================== */}
        {currentUserRole === 'admin' && (
          <>
            {/* طلبات الموظفين والسيارات للمسؤول */}
            {currentTab === 'admin_requests' && (
              <View>
                <Text style={styles.sectionTitle}>🔔 طلبات الموظفين والسيارات</Text>
                {requests.length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد طلبات مسجلة</Text>
                ) : (
                  requests.map((item) => (
                    <View key={item.id} style={styles.card}>
                      <Text style={styles.cardTitle}>طلب {item.type} - السائق: {item.driverName}</Text>
                      <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                      <Text style={styles.cardDetail}>تاريخ الطلب: {item.date}</Text>
                      <Text style={styles.cardDetail}>المحطة / الورشة: {item.station}</Text>
                      <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                      <Text style={styles.cardDetail}>الكمية: {item.quantity}</Text>
                      <Text style={[styles.cardDetail, { fontWeight: 'bold', color: item.status === 'تم الاعتماد' ? '#2E7D32' : item.status === 'مرفوض' ? '#D32F2F' : '#EF6C00' }]}>
                        الحالة: {item.status}
                      </Text>

                      {item.status === 'قيد المراجعة' && (
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 }}>
                          <TouchableOpacity
                            style={[styles.syncBtn, { backgroundColor: '#2E7D32' }]}
                            onPress={() => {
                              const updated = requests.map(r => r.id === item.id ? { ...r, status: 'تم الاعتماد' as const } : r);
                              saveRequestsLocally(updated);
                            }}
                          >
                            <Text style={styles.syncBtnText}>✅ اعتماد</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.syncBtn, { backgroundColor: '#D32F2F' }]}
                            onPress={() => {
                              const updated = requests.map(r => r.id === item.id ? { ...r, status: 'مرفوض' as const } : r);
                              saveRequestsLocally(updated);
                            }}
                          >
                            <Text style={styles.syncBtnText}>❌ رفض</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 10️⃣ شاشة صلاحيات المستخدمين (اختيار أي سيارة لمنح/منع الصلاحيات) */}
            {currentTab === 'user_permissions' && (
              <View>
                <Text style={styles.sectionTitle}>🔑 صلاحيات المستخدمين والسيارات</Text>

                <View style={styles.card}>
                  <Text style={styles.inputLabel}>اختر السيارة لمنحها أو منعها من الصلاحيات:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                    {allVehicles.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.chipBtn, selectedVehForPerms === v.id && styles.chipBtnActive]}
                        onPress={() => setSelectedVehForPerms(v.id)}
                      >
                        <Text style={[styles.chipText, selectedVehForPerms === v.id && styles.chipTextActive]}>
                          {v.name} ({v.plateNumber})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {(() => {
                    const activePerms = vehiclePermissions[selectedVehForPerms] || {
                      canRequestFuel: true,
                      canRequestOils: true,
                      canRequestTires: true,
                      canRequestBatteries: true,
                      canRequestMaintenance: true
                    };

                    const togglePerm = (permKey: keyof VehiclePermission) => {
                      const updated = {
                        ...vehiclePermissions,
                        [selectedVehForPerms]: {
                          ...activePerms,
                          [permKey]: !activePerms[permKey]
                        }
                      };
                      setVehiclePermissions(updated);
                      AsyncStorage.setItem('@vehicle_permissions', JSON.stringify(updated));
                    };

                    return (
                      <View style={{ marginTop: 10 }}>
                        <View style={styles.permRow}>
                          <Text style={styles.inputLabel}>صلاحية طلب الوقود:</Text>
                          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: activePerms.canRequestFuel ? '#2E7D32' : '#D32F2F' }]} onPress={() => togglePerm('canRequestFuel')}>
                            <Text style={styles.syncBtnText}>{activePerms.canRequestFuel ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.permRow}>
                          <Text style={styles.inputLabel}>صلاحية طلب الزيوت:</Text>
                          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: activePerms.canRequestOils ? '#2E7D32' : '#D32F2F' }]} onPress={() => togglePerm('canRequestOils')}>
                            <Text style={styles.syncBtnText}>{activePerms.canRequestOils ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.permRow}>
                          <Text style={styles.inputLabel}>صلاحية طلب الإطارات:</Text>
                          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: activePerms.canRequestTires ? '#2E7D32' : '#D32F2F' }]} onPress={() => togglePerm('canRequestTires')}>
                            <Text style={styles.syncBtnText}>{activePerms.canRequestTires ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.permRow}>
                          <Text style={styles.inputLabel}>صلاحية طلب البطاريات:</Text>
                          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: activePerms.canRequestBatteries ? '#2E7D32' : '#D32F2F' }]} onPress={() => togglePerm('canRequestBatteries')}>
                            <Text style={styles.syncBtnText}>{activePerms.canRequestBatteries ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.permRow}>
                          <Text style={styles.inputLabel}>صلاحية طلب الصيانة:</Text>
                          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: activePerms.canRequestMaintenance ? '#2E7D32' : '#D32F2F' }]} onPress={() => togglePerm('canRequestMaintenance')}>
                            <Text style={styles.syncBtnText}>{activePerms.canRequestMaintenance ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              </View>
            )}

            {/* 🏷️ شاشة التكويد الجديدة (تظهر للمسؤول فقط) */}
            {currentTab === 'coding_screen' && (
              <View>
                <Text style={styles.sectionTitle}>🏷️ شاشة التكويد (إدارة القوائم)</Text>

                <View style={styles.subTabRow}>
                  {[
                    { key: 'stations', label: 'تكويد المحطات' },
                    { key: 'fuelTypes', label: 'أنواع الوقود' },
                    { key: 'allocations', label: 'المخصصات' },
                    { key: 'oils', label: 'الزيوت' },
                    { key: 'spareParts', label: 'قطع الغيار' },
                    { key: 'batteries', label: 'البطاريات' },
                    { key: 'tires', label: 'الإطارات' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.subTabBtn, codingSubTab === cat.key && styles.activeSubTabBtn]}
                      onPress={() => setCodingSubTab(cat.key)}
                    >
                      <Text style={[styles.subTabBtnText, codingSubTab === cat.key && styles.activeSubTabBtnText]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.inputLabel}>إضافة بيان جديد لـ ({codingSubTab}):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="مثال: محطة الزبيدي / محطة الشركة"
                    value={newCodeInput}
                    onChangeText={setNewCodeInput}
                  />
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => handleAddCodeItem(codingSubTab as keyof CodeCategories)}
                  >
                    <Text style={styles.submitBtnText}>إضافة وتكود ➕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>العناصر المكوّدة حالياً:</Text>
                {codes[codingSubTab as keyof CodeCategories].map((item, idx) => (
                  <View key={idx} style={[styles.card, { paddingVertical: 10 }]}>
                    <Text style={styles.cardTitle}>• {item}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* 4️⃣ شريط التنقل السفلي مع زر تسجيل الخروج الثابت بالأسفل */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.navBar}>
          {currentUserRole === 'user' ? (
            <>
              <TouchableOpacity onPress={() => setCurrentTab('my_requests')}>
                <Text style={styles.navText}>📋 طلباتي</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentTab('vehicle_info')}>
                <Text style={styles.navText}>🚘 السيارة</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentTab('request_service')}>
                <Text style={styles.navText}>🛠️ طلب خدمة</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentTab('settings')}>
                <Text style={styles.navText}>⚙️ الإعدادات</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => setCurrentTab('admin_requests')}>
                <Text style={styles.navText}>🔔 الطلبات</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentTab('user_permissions')}>
                <Text style={styles.navText}>🔑 الصلاحيات</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentTab('coding_screen')}>
                <Text style={styles.navText}>🏷️ التكويد</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 4️⃣ زر تسجيل الخروج لجميع الحسابات بالأسفل */}
        <TouchableOpacity style={styles.logoutBottomBtn} onPress={handleLogout}>
          <Text style={styles.logoutBottomText}>تسجيل الخروج 🚪</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#0D47A1', justifyContent: 'center', padding: 20 },
  loginCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 5 },
  loginTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D47A1', textAlign: 'center' },
  loginSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  syncHeader: { backgroundColor: '#1565C0', padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  syncBtn: { backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  syncBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  syncTimeText: { color: '#E3F2FD', fontSize: 11 },
  header: { backgroundColor: '#0D47A1', padding: 14, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1A237E', textAlign: 'right' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right' },
  cardDetail: { fontSize: 13, color: '#444', marginTop: 4, textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  accordionCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2 },
  accordionLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginVertical: 4, textAlign: 'right' },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#444', marginTop: 8, textAlign: 'right' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 8, marginTop: 4, textAlign: 'right' },
  subTabRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 10 },
  subTabBtn: { backgroundColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, margin: 3 },
  activeSubTabBtn: { backgroundColor: '#0D47A1' },
  subTabBtnText: { color: '#333', fontSize: 12 },
  activeSubTabBtnText: { color: '#FFF', fontWeight: 'bold' },
  chipBtn: { backgroundColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  chipBtnActive: { backgroundColor: '#0D47A1' },
  chipText: { color: '#333', fontSize: 12 },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  formCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 10 },
  submitBtn: { backgroundColor: '#0D47A1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  editRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  penIcon: { fontSize: 13, color: '#0D47A1', fontWeight: 'bold' },
  inlineEditBox: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8, marginTop: 8 },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF' },
  navBar: { flexDirection: 'row-reverse', justifyContent: 'space-around', paddingVertical: 10, borderTopWidth: 1, borderColor: '#DDD' },
  navText: { fontSize: 12, fontWeight: 'bold', color: '#0D47A1' },
  logoutBottomBtn: { backgroundColor: '#D32F2F', paddingVertical: 8, alignItems: 'center' },
  logoutBottomText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20 },
  permRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }
});

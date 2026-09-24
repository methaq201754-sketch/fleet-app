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
  Modal
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

interface UserPermission {
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

export default function App() {
  // 🔒 حالة تسجيل الدخول
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests');

  // Sub-tabs
  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<string>('وقود');
  const [reportTypeTab, setReportTypeTab] = useState<string>('وقود');
  const [reportStatusTab, setReportStatusTab] = useState<string>('تم الاعتماد');
  const [adminReqSubTab, setAdminReqSubTab] = useState<string>('وقود');

  // فلترة التقارير
  const [reportYear, setReportYear] = useState('2026');
  const [reportMonth, setReportMonth] = useState('جميع الأشهر');

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

  // 👨‍✈️ قائمة السائقين (تعديل 9)
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 'd1', name: 'ميثاق عبده علي مقبل', phone: '770000000', licenseNo: 'L-101' },
    { id: 'd2', name: 'أحمد علي', phone: '771111111', licenseNo: 'L-102' }
  ]);

  // 🔑 صلاحيات المستخدمين (تعديل 10)
  const [userPermissions, setUserPermissions] = useState<UserPermission>({
    canRequestFuel: true,
    canRequestOils: true,
    canRequestTires: true,
    canRequestBatteries: true,
    canRequestMaintenance: true,
  });

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

  // ⚙️ تغيير كلمة المرور والتعديلات
  const [userPassword, setUserPassword] = useState('000');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [editVehicleName, setEditVehicleName] = useState('');
  const [editPlateNumber, setEditPlateNumber] = useState('');
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  // 🚘 مدخلات إدارية لإضافة/تعديل سيارة (تعديل 8)
  const [adminVehName, setAdminVehName] = useState('');
  const [adminVehPlate, setAdminVehPlate] = useState('');
  const [adminVehDriver, setAdminVehDriver] = useState('');
  const [adminVehType, setAdminVehType] = useState('');
  const [adminVehCapacity, setAdminVehCapacity] = useState('');
  const [adminVehTransport, setAdminVehTransport] = useState('');
  const [adminVehModel, setAdminVehModel] = useState('');
  const [adminVehPassengers, setAdminVehPassengers] = useState('');
  const [adminVehFuel, setAdminVehFuel] = useState('ديزل');
  const [selectedVehForStatus, setSelectedVehForStatus] = useState<string>('v1');

  // 👨‍✈️ مدخلات إدارة السائقين (تعديل 9)
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [driverLicenseInput, setDriverLicenseInput] = useState('');

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedSyncTime = await AsyncStorage.getItem('@last_sync_time');
      const savedVehicles = await AsyncStorage.getItem('@all_vehicles');
      const savedDrivers = await AsyncStorage.getItem('@all_drivers');
      const savedPerms = await AsyncStorage.getItem('@user_permissions');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedVehicles) setAllVehicles(JSON.parse(savedVehicles));
      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
      if (savedPerms) setUserPermissions(JSON.parse(savedPerms));
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

  const saveDriversLocally = async (newList: Driver[]) => {
    setDrivers(newList);
    await AsyncStorage.setItem('@all_drivers', JSON.stringify(newList));
  };

  // 🔐 تسجيل الدخول
  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم أو رقم السيارة');
      return;
    }

    if (loginPassword !== '000' && loginPassword !== userPassword) {
      Alert.alert('خطأ في كلمة المرور', 'كلمة المرور غير صحيحة. كلمة المرور الافتراضية هي: 000');
      return;
    }

    if (loginUsername.trim() === 'admin' || loginUsername.trim() === 'المسؤول') {
      setCurrentUserRole('admin');
      setIsLoggedIn(true);
      setCurrentTab('admin_requests');
      Alert.alert('مرحباً بك', 'تم تسجيل الدخول كمسؤول النظام');
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
      setEditVehicleName(foundVehicle.name);
      setEditPlateNumber(foundVehicle.plateNumber);
    } else {
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
      setEditVehicleName(tempVeh.name);
      setEditPlateNumber(tempVeh.plateNumber);
    }

    setCurrentUserRole('user');
    setIsLoggedIn(true);
    setCurrentTab('my_requests');
    Alert.alert('تم الدخول بنجاح', `مرحباً بك في النظام (v1.1.0)`);
  };

  // 🚪 تسجيل الخروج (تعديل 4)
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
    Alert.alert('تم', 'تم تسجيل الخروج بنجاح.');
  };

  // 🛠️ تقديم طلب خدمة (تعديل 7 + فحص حالة السيارة والصلاحيات)
  const handleCreateRequest = (type: any) => {
    // 1. فحص حالة السيارة في الخدمة أم موقوفة (تعديل 8)
    if (userVehicle.status === 'موقف') {
      Alert.alert('تنبيه خطأ', 'تم إيقاف هذه السيارة من قبل الإدارة. لا يمكن تقديم أي طلبات مصروفات.');
      return;
    }

    // 2. فحص صلاحيات المستخدم (تعديل 10)
    if (type === 'وقود' && !userPermissions.canRequestFuel) {
      Alert.alert('تنبيه الصلاحيات', 'ليس لديك صلاحية لطلب الوقود.'); return;
    }
    if (type === 'زيوت' && !userPermissions.canRequestOils) {
      Alert.alert('تنبيه الصلاحيات', 'ليس لديك صلاحية لطلب الزيوت.'); return;
    }
    if (type === 'إطارات' && !userPermissions.canRequestTires) {
      Alert.alert('تنبيه الصلاحيات', 'ليس لديك صلاحية لطلب الإطارات.'); return;
    }
    if (type === 'بطاريات' && !userPermissions.canRequestBatteries) {
      Alert.alert('تنبيه الصلاحيات', 'ليس لديك صلاحية لطلب البطاريات.'); return;
    }
    if (type === 'صيانة وقطع غيار' && !userPermissions.canRequestMaintenance) {
      Alert.alert('تنبيه الصلاحيات', 'ليس لديك صلاحية لطلب الصيانة.'); return;
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
      fuelType: reqFuelType,
      notes: reqNotes,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    saveRequestsLocally(updated);

    // إشعار فوق الشاشة للمسؤول والمستخدم (تعديل 6)
    Alert.alert('🔔 إشعار فوق الشاشة', `تم إرسال طلب ${type} جديد إلى المسؤول بنجاح وهو قيد المراجعة.`);

    setReqProcessNo('');
    setReqQuantity('');
    setReqPriceAmount('');
    setReqAllocation('');
    setReqStation('');
    setReqNotes('');
  };

  // 👑 اعتماد أو رفض الطلب بواسطة المسؤول (تعديل 6)
  const handleAdminDecision = (reqId: string, newStatus: 'تم الاعتماد' | 'مرفوض') => {
    const updated = requests.map((r) => {
      if (r.id === reqId) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    saveRequestsLocally(updated);
    Alert.alert('🔔 إشعار فوق الشاشة', `تم تحديث حالة الطلب إلى (${newStatus}) وإشعار المستخدم بذلك.`);
  };

  // 🚘 إضافة وتعديل وإيقاف سيارة (تعديل 8)
  const handleAddVehicle = () => {
    if (!adminVehName || !adminVehPlate) {
      Alert.alert('خطأ', 'يرجى إدخال اسم ورقم السيارة');
      return;
    }
    const newV: Vehicle = {
      id: `v_${Date.now()}`,
      name: adminVehName,
      plateNumber: adminVehPlate,
      driverName: adminVehDriver || 'سائق عام',
      type: adminVehType || 'شاحنة',
      capacity: adminVehCapacity || '10 طن',
      transportType: adminVehTransport || 'عام',
      model: adminVehModel || '2023',
      passengers: adminVehPassengers || '2',
      fuelType: adminVehFuel,
      status: 'في الخدمة' // افتراضياً في الخدمة
    };
    const updated = [...allVehicles, newV];
    saveVehiclesLocally(updated);
    Alert.alert('تم', 'تمت إضافة السيارة الجديدة بنجاح، وحالتها الافتراضية: في الخدمة');
    setAdminVehName(''); setAdminVehPlate(''); setAdminVehDriver('');
  };

  const toggleVehicleStatus = (status: 'في الخدمة' | 'موقف') => {
    const updated = allVehicles.map((v) => {
      if (v.id === selectedVehForStatus) {
        return { ...v, status };
      }
      return v;
    });
    saveVehiclesLocally(updated);

    // إذا كانت السيارة المحددة هي سيارة المستخدم الحالي نحدث حالتها فوراً
    if (userVehicle.id === selectedVehForStatus) {
      setUserVehicle({ ...userVehicle, status });
    }

    Alert.alert('تم', `تم تغيير حالة السيارة إلى: ${status}`);
  };

  // 👨‍✈️ إدارة السائقين (تعديل 9)
  const handleAddDriver = () => {
    if (!driverNameInput) {
      Alert.alert('خطأ', 'يرجى إدخال اسم السائق'); return;
    }
    const newD: Driver = {
      id: `d_${Date.now()}`,
      name: driverNameInput,
      phone: driverPhoneInput,
      licenseNo: driverLicenseInput
    };
    const updated = [...drivers, newD];
    saveDriversLocally(updated);
    Alert.alert('تم', 'تمت إضافة السائق بنجاح');
    setDriverNameInput(''); setDriverPhoneInput(''); setDriverLicenseInput('');
  };

  const handleDeleteDriver = (id: string) => {
    const updated = drivers.filter(d => d.id !== id);
    saveDriversLocally(updated);
    Alert.alert('تم', 'تم حذف السائق');
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
          <Text style={styles.loginSubtitle}>تسجيل الدخول للنظام (v1.1.0)</Text>

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

          <Text style={styles.hintText}>* كلمة المرور الافتراضية للجميع هي: 000</Text>
          <Text style={styles.hintText}>* للدخول كمسؤول أدخل: admin في اسم المستخدم</Text>
        </View>
      </SafeAreaView>
    );
  }

  // احتساب إجماليات التقارير للمستخدم (تعديل 5)
  const filteredReportRequests = requests.filter((r) => {
    const isUserVeh = r.vehicleId === userVehicle.id || r.driverName === userVehicle.driverName;
    const isType = r.type === reportTypeTab;
    const isStatus = r.status === reportStatusTab;
    return isUserVeh && isType && isStatus;
  });

  const totalQuantitySum = filteredReportRequests.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
  const totalPriceSum = filteredReportRequests.reduce((acc, curr) => acc + (parseFloat(curr.priceAmount || '0') || 0), 0);

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
        <TouchableOpacity style={styles.logoutTopBtn} onPress={handleLogout}>
          <Text style={styles.logoutTopText}>خروج 🚪</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? `السيارات (${userVehicle.plateNumber})` : 'أطلس - لوحة المسؤول (v1.1.0)'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ==================== 👤 حساب المستخدم ==================== */}
        {currentUserRole === 'user' && (
          <>
            {/* 1️⃣ أيقونة وقائمة "طلباتي" (تعديل 1) */}
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

            {/* 2️⃣ شاشة بيانات السيارة المسجلة بالحساب (تعديل 2) */}
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
                  <Text style={styles.accordionLabel}>المودل: {userVehicle.model}</Text>
                  <Text style={styles.accordionLabel}>عدد الركاب: {userVehicle.passengers}</Text>
                  <Text style={styles.accordionLabel}>نوع الوقود: {userVehicle.fuelType}</Text>
                  <Text style={[styles.accordionLabel, { color: userVehicle.status === 'في الخدمة' ? '#2E7D32' : '#D32F2F', fontWeight: 'bold' }]}>
                    حالة السيارة: {userVehicle.status}
                  </Text>
                </View>
              </View>
            )}

            {/* 7️⃣ شاشة طلب خدمة (تعديل 7) */}
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

            {/* 5️⃣ شاشة التقارير الخاصة بالمستخدم (تعديل 5) */}
            {currentTab === 'reports' && (
              <View>
                <Text style={styles.sectionTitle}>📊 التقارير للمستخدم</Text>

                {/* خيارات الفلترة بالنوع والحالة */}
                <Text style={styles.inputLabel}>اختر نوع المصروف:</Text>
                <View style={styles.subTabRow}>
                  {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.subTabBtn, reportTypeTab === cat && styles.activeSubTabBtn]}
                      onPress={() => setReportTypeTab(cat)}
                    >
                      <Text style={[styles.subTabBtnText, reportTypeTab === cat && styles.activeSubTabBtnText]}>
                        تقارير {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>اختر حالة الطلب:</Text>
                <View style={styles.subTabRow}>
                  {[
                    { label: 'تم الاعتماد', value: 'تم الاعتماد' },
                    { label: 'قيد المراجعة', value: 'قيد المراجعة' },
                    { label: 'مرفوض', value: 'مرفوض' },
                  ].map((st) => (
                    <TouchableOpacity
                      key={st.value}
                      style={[styles.subTabBtn, reportStatusTab === st.value && styles.activeSubTabBtn]}
                      onPress={() => setReportStatusTab(st.value)}
                    >
                      <Text style={[styles.subTabBtnText, reportStatusTab === st.value && styles.activeSubTabBtnText]}>
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* خيارات السنة والشهر */}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginVertical: 8 }}>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text style={styles.inputLabel}>السنة:</Text>
                    <TextInput style={styles.input} value={reportYear} onChangeText={setReportYear} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <Text style={styles.inputLabel}>الشهر:</Text>
                    <TextInput style={styles.input} value={reportMonth} onChangeText={setReportMonth} />
                  </View>
                </View>

                {/* بطاقة الإجمالي */}
                <View style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={styles.cardTitle}>إجمالي تقارير {reportTypeTab} ({reportStatusTab})</Text>
                  <Text style={styles.cardDetail}>الإجمالي باللتر / العدد: {totalQuantitySum}</Text>
                  <Text style={styles.cardDetail}>الإجمالي بالقيمة: {totalPriceSum} ريال</Text>
                </View>

                {/* قائمة العمليات التفصيلية */}
                {filteredReportRequests.length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد سجلات مطابقة لهذه الفلترة</Text>
                ) : (
                  filteredReportRequests.map((item) => (
                    <View key={item.id} style={styles.card}>
                      <Text style={styles.cardDetail}>التاريخ: {item.date}</Text>
                      <Text style={styles.cardDetail}>الكمية: {item.quantity}</Text>
                      <Text style={styles.cardDetail}>المحطة / الورشة: {item.station || 'غير محدد'}</Text>
                      <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 3️⃣ شاشة الإعدادات للمستخدم (تعديل 3 + 4) */}
            {currentTab === 'settings' && (
              <View>
                <Text style={styles.sectionTitle}>⚙️ إعدادات الحساب</Text>
                <View style={styles.card}>
                  
                  {/* اسم السيارة مع أيقونة التعديل ✏️ */}
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.inputLabel}>اسم السيارة: {userVehicle.name}</Text>
                    <TouchableOpacity onPress={() => setIsEditingVehicle(!isEditingVehicle)}>
                      <Text style={{ fontSize: 18 }}>✏️ تعديل</Text>
                    </TouchableOpacity>
                  </View>

                  {/* رقم السيارة مع أيقونة التعديل ✏️ */}
                  <Text style={styles.inputLabel}>رقم السيارة: {userVehicle.plateNumber}</Text>
                  <Text style={styles.inputLabel}>اسم السائق: {userVehicle.driverName}</Text>

                  {/* في حال الضغط على التعديل */}
                  {isEditingVehicle && (
                    <View style={{ backgroundColor: '#F0F0F0', padding: 10, borderRadius: 8, marginTop: 10 }}>
                      <Text style={styles.inputLabel}>تعديل اسم السيارة:</Text>
                      <TextInput style={styles.input} value={editVehicleName} onChangeText={setEditVehicleName} />
                      <Text style={styles.inputLabel}>تعديل رقم السيارة:</Text>
                      <TextInput style={styles.input} value={editPlateNumber} onChangeText={setEditPlateNumber} />
                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#4CAF50', marginTop: 10 }]}
                        onPress={() => {
                          const updated = { ...userVehicle, name: editVehicleName, plateNumber: editPlateNumber };
                          setUserVehicle(updated);
                          setIsEditingVehicle(false);
                          Alert.alert('تم', 'تم حفظ التعديلات محلياً');
                        }}
                      >
                        <Text style={styles.submitBtnText}>حفظ التعديلات</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* تغيير كلمة المرور */}
                  <Text style={[styles.inputLabel, { marginTop: 15 }]}>تغيير كلمة المرور الخاصة بالمستخدم:</Text>
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
                      Alert.alert('تم', 'تم تغيير كلمة المرور الخاصة بك بنجاح.');
                    }}
                  >
                    <Text style={styles.submitBtnText}>حفظ كلمة المرور الجديدة</Text>
                  </TouchableOpacity>
                </View>

                {/* 4️⃣ أيقونة تسجيل الخروج بالأسفل (تعديل 4) */}
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#D32F2F', marginTop: 25, paddingVertical: 14 }]} onPress={handleLogout}>
                  <Text style={styles.submitBtnText}>🚪 تسجيل الخروج</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ==================== 👑 حساب المسؤول ==================== */}
        {currentUserRole === 'admin' && (
          <>
            {/* 6️⃣ طلبات الموظفين للمسؤول (تعديل 6) */}
            {currentTab === 'admin_requests' && (
              <View>
                <Text style={styles.sectionTitle}>🔔 طلبات الموظفين والسيارات</Text>

                <View style={styles.subTabRow}>
                  {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.subTabBtn, adminReqSubTab === cat && styles.activeSubTabBtn]}
                      onPress={() => setAdminReqSubTab(cat)}
                    >
                      <Text style={[styles.subTabBtnText, adminReqSubTab === cat && styles.activeSubTabBtnText]}>
                        طلبات {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {requests.filter(r => r.type === adminReqSubTab).length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد طلبات لـ ({adminReqSubTab})</Text>
                ) : (
                  requests.filter(r => r.type === adminReqSubTab).map((item) => (
                    <View key={item.id} style={styles.card}>
                      <Text style={styles.cardTitle}>طلب {item.type} - السائق: {item.driverName}</Text>
                      <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                      <Text style={styles.cardDetail}>تاريخ الطلب: {item.date}</Text>
                      <Text style={styles.cardDetail}>المحطة / الورشة: {item.station || 'غير محدد'}</Text>
                      <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                      <Text style={styles.cardDetail}>القيمة / الكمية: {item.quantity}</Text>
                      {item.type === 'وقود' && <Text style={styles.cardDetail}>نوع الوقود: {item.fuelType || 'ديزل'}</Text>}
                      <Text style={styles.cardDetail}>الملاحظات: {item.notes || 'لا يوجد'}</Text>
                      <Text style={[styles.cardDetail, { fontWeight: 'bold', color: item.status === 'تم الاعتماد' ? 'green' : item.status === 'مرفوض' ? 'red' : 'orange' }]}>
                        الحالة الحالية: {item.status}
                      </Text>

                      {/* أزرار الموافقة والرفض */}
                      {item.status === 'قيد المراجعة' && (
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 }}>
                          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleAdminDecision(item.id, 'تم الاعتماد')}>
                            <Text style={styles.syncBtnText}>✅ موافقة وإشعار</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: '#F44336' }]} onPress={() => handleAdminDecision(item.id, 'مرفوض')}>
                            <Text style={styles.syncBtnText}>❌ رفض وإشعار</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 8️⃣ شاشة إضافة وتعديل وإيقاف سيارة (تعديل 8) */}
            {currentTab === 'manage_vehicles' && (
              <View>
                <Text style={styles.sectionTitle}>🚗 إضافة وتعديل وإيقاف سيارة</Text>

                {/* إضافة سيارة جديدة */}
                <View style={styles.formCard}>
                  <Text style={styles.cardTitle}>➕ إضافة سيارة جديدة</Text>
                  <Text style={styles.inputLabel}>اسم السيارة:</Text>
                  <TextInput style={styles.input} value={adminVehName} onChangeText={setAdminVehName} />
                  <Text style={styles.inputLabel}>رقم السيارة:</Text>
                  <TextInput style={styles.input} value={adminVehPlate} onChangeText={setAdminVehPlate} />
                  <Text style={styles.inputLabel}>اسم السائق:</Text>
                  <TextInput style={styles.input} value={adminVehDriver} onChangeText={setAdminVehDriver} />
                  <Text style={styles.inputLabel}>نوع السيارة:</Text>
                  <TextInput style={styles.input} value={adminVehType} onChangeText={setAdminVehType} />

                  <TouchableOpacity style={styles.submitBtn} onPress={handleAddVehicle}>
                    <Text style={styles.submitBtnText}>إضافة السيارة (حالتها: في الخدمة)</Text>
                  </TouchableOpacity>
                </View>

                {/* إيقاف وتدشين سيارة */}
                <View style={[styles.formCard, { marginTop: 15 }]}>
                  <Text style={styles.cardTitle}>🛑/▶️ إيقاف وتشغيل سيارة</Text>
                  <Text style={styles.inputLabel}>اختر السيارة:</Text>
                  <View style={{ borderWidth: 1, borderColor: '#CCC', borderRadius: 8, marginVertical: 5 }}>
                    {allVehicles.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={{ padding: 10, backgroundColor: selectedVehForStatus === v.id ? '#BBDEFB' : '#FFF' }}
                        onPress={() => setSelectedVehForStatus(v.id)}
                      >
                        <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>{v.name} - ({v.plateNumber}) [{v.status}]</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 }}>
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#2E7D32', flex: 1, marginLeft: 5 }]} onPress={() => toggleVehicleStatus('في الخدمة')}>
                      <Text style={styles.submitBtnText}>▶️ تشغيل (في الخدمة)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#D32F2F', flex: 1, marginRight: 5 }]} onPress={() => toggleVehicleStatus('موقف')}>
                      <Text style={styles.submitBtnText}>🛑 إيقاف السيارة</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* 9️⃣ شاشة بيانات السائقين (تعديل 9) */}
            {currentTab === 'manage_drivers' && (
              <View>
                <Text style={styles.sectionTitle}>👨‍✈️ إدارة بيانات السائقين</Text>

                <View style={styles.formCard}>
                  <Text style={styles.cardTitle}>➕ إضافة سائق جديد</Text>
                  <Text style={styles.inputLabel}>اسم السائق:</Text>
                  <TextInput style={styles.input} value={driverNameInput} onChangeText={setDriverNameInput} />
                  <Text style={styles.inputLabel}>رقم الهاتف:</Text>
                  <TextInput style={styles.input} value={driverPhoneInput} onChangeText={setDriverPhoneInput} keyboardType="phone-pad" />
                  <Text style={styles.inputLabel}>رقم الرخصة:</Text>
                  <TextInput style={styles.input} value={driverLicenseInput} onChangeText={setDriverLicenseInput} />

                  <TouchableOpacity style={styles.submitBtn} onPress={handleAddDriver}>
                    <Text style={styles.submitBtnText}>حفظ السائق</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>قائمة السائقين الحاليين:</Text>
                {drivers.map((d) => (
                  <View key={d.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{d.name}</Text>
                    <Text style={styles.cardDetail}>الهاتف: {d.phone}</Text>
                    <Text style={styles.cardDetail}>الرخصة: {d.licenseNo}</Text>
                    <TouchableOpacity style={{ marginTop: 8 }} onPress={() => handleDeleteDriver(d.id)}>
                      <Text style={{ color: 'red', fontWeight: 'bold' }}>🗑️ حذف السائق</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* 🔟 شاشة صلاحيات المستخدمين (تعديل 10) */}
            {currentTab === 'user_permissions' && (
              <View>
                <Text style={styles.sectionTitle}>🔑 صلاحيات المستخدمين</Text>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>تحكم بالصلاحيات الممنوحة لسائقي ورجال الحركة:</Text>

                  <View style={styles.permRow}>
                    <Text style={styles.inputLabel}>صلاحية طلب الوقود:</Text>
                    <TouchableOpacity
                      style={[styles.syncBtn, { backgroundColor: userPermissions.canRequestFuel ? '#4CAF50' : '#D32F2F' }]}
                      onPress={() => setUserPermissions({ ...userPermissions, canRequestFuel: !userPermissions.canRequestFuel })}
                    >
                      <Text style={styles.syncBtnText}>{userPermissions.canRequestFuel ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.permRow}>
                    <Text style={styles.inputLabel}>صلاحية طلب الزيوت:</Text>
                    <TouchableOpacity
                      style={[styles.syncBtn, { backgroundColor: userPermissions.canRequestOils ? '#4CAF50' : '#D32F2F' }]}
                      onPress={() => setUserPermissions({ ...userPermissions, canRequestOils: !userPermissions.canRequestOils })}
                    >
                      <Text style={styles.syncBtnText}>{userPermissions.canRequestOils ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.permRow}>
                    <Text style={styles.inputLabel}>صلاحية طلب الإطارات:</Text>
                    <TouchableOpacity
                      style={[styles.syncBtn, { backgroundColor: userPermissions.canRequestTires ? '#4CAF50' : '#D32F2F' }]}
                      onPress={() => setUserPermissions({ ...userPermissions, canRequestTires: !userPermissions.canRequestTires })}
                    >
                      <Text style={styles.syncBtnText}>{userPermissions.canRequestTires ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.permRow}>
                    <Text style={styles.inputLabel}>صلاحية طلب البطاريات:</Text>
                    <TouchableOpacity
                      style={[styles.syncBtn, { backgroundColor: userPermissions.canRequestBatteries ? '#4CAF50' : '#D32F2F' }]}
                      onPress={() => setUserPermissions({ ...userPermissions, canRequestBatteries: !userPermissions.canRequestBatteries })}
                    >
                      <Text style={styles.syncBtnText}>{userPermissions.canRequestBatteries ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.permRow}>
                    <Text style={styles.inputLabel}>صلاحية طلب الصيانة:</Text>
                    <TouchableOpacity
                      style={[styles.syncBtn, { backgroundColor: userPermissions.canRequestMaintenance ? '#4CAF50' : '#D32F2F' }]}
                      onPress={() => setUserPermissions({ ...userPermissions, canRequestMaintenance: !userPermissions.canRequestMaintenance })}
                    >
                      <Text style={styles.syncBtnText}>{userPermissions.canRequestMaintenance ? 'ممنوحة ✅' : 'محظورة ❌'}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { marginTop: 15 }]}
                    onPress={async () => {
                      await AsyncStorage.setItem('@user_permissions', JSON.stringify(userPermissions));
                      Alert.alert('تم', 'تم حفظ الصلاحيات المحدثة بنجاح.');
                    }}
                  >
                    <Text style={styles.submitBtnText}>حفظ الصلاحيات</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* الشريط السفلي للتنقل */}
      <View style={styles.navBar}>
        {currentUserRole === 'user' ? (
          <>
            <TouchableOpacity onPress={() => setCurrentTab('my_requests')}>
              <Text style={styles.navText}>📋 طلباتي</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('request_service')}>
              <Text style={styles.navText}>🛠️ طلب خدمة</Text>
            </TouchableOpacity>
            {/* تم إخفاء أيقونة بيانات السيارات من شاشة المستخدم بناءً على الطلب رقم 5 */}
            <TouchableOpacity onPress={() => setCurrentTab('reports')}>
              <Text style={styles.navText}>📊 التقارير</Text>
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
            <TouchableOpacity onPress={() => setCurrentTab('manage_vehicles')}>
              <Text style={styles.navText}>🚗 السيارات</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('manage_drivers')}>
              <Text style={styles.navText}>👨‍✈️ السائقين</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('user_permissions')}>
              <Text style={styles.navText}>🔑 الصلاحيات</Text>
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
  largeBackArrow: { fontSize: 28, fontWeight: 'bold', color: '#0D47A1' },
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
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20 },
  permRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }
});

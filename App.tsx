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

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  assignedVehiclePlate: string;
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests');

  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<string>('وقود');
  const [codingSubTab, setCodingSubTab] = useState<keyof CodeCategories>('stations');
  const [dashboardSubTab, setDashboardSubTab] = useState<string>('add_vehicle');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('لم تتم المزامنة بعد');

  // بيانات السيارات
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

  // بيانات السائقين
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 'd1', name: 'ميثاق عبده علي مقبل', phone: '770000000', licenseNumber: 'DL-9981', assignedVehiclePlate: '1010-أ' },
    { id: 'd2', name: 'أحمد علي', phone: '771111111', licenseNumber: 'DL-5542', assignedVehiclePlate: '2020-ب' }
  ]);

  // نماذج الإدخال والإدارة (لوحة التحكم)
  const [vehNameInput, setVehNameInput] = useState('');
  const [vehPlateInput, setVehPlateInput] = useState('');
  const [vehDriverInput, setVehDriverInput] = useState('');
  const [vehTypeInput, setVehTypeInput] = useState('');
  const [vehCapacityInput, setVehCapacityInput] = useState('');
  const [vehTransportTypeInput, setVehTransportTypeInput] = useState('');
  const [vehModelInput, setVehModelInput] = useState('');
  const [vehPassengersInput, setVehPassengersInput] = useState('2');
  const [vehFuelTypeInput, setVehFuelTypeInput] = useState('ديزل');

  const [selectedVehForEdit, setSelectedVehForEdit] = useState<string>('v1');

  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [driverLicenseInput, setDriverLicenseInput] = useState('');
  const [driverVehPlateInput, setDriverVehPlateInput] = useState('');
  const [selectedDriverForEdit, setSelectedDriverForEdit] = useState<string>('d1');

  const [vehiclePermissions, setVehiclePermissions] = useState<Record<string, VehiclePermission>>({
    v1: { canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true },
    v2: { canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true }
  });
  const [selectedVehForPerms, setSelectedVehForPerms] = useState<string>('v1');

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
  const [userVehicle, setUserVehicle] = useState<Vehicle>(allVehicles[0]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('ديزل');
  const [reqNotes, setReqNotes] = useState('');

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

  const saveDriversLocally = async (newList: Driver[]) => {
    setDrivers(newList);
    await AsyncStorage.setItem('@all_drivers', JSON.stringify(newList));
  };

  const saveCodesLocally = async (newCodes: CodeCategories) => {
    setCodes(newCodes);
    await AsyncStorage.setItem('@fleet_codes', JSON.stringify(newCodes));
  };

  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم');
      return;
    }

    if (loginPassword !== '000' && loginPassword !== userPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة.');
      return;
    }

    if (loginUsername.trim().toLowerCase() === 'admin' || loginUsername.trim() === 'المسؤول') {
      setCurrentUserRole('admin');
      setIsLoggedIn(true);
      setCurrentTab('admin_dashboard');
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
    }

    setCurrentUserRole('user');
    setIsLoggedIn(true);
    setCurrentTab('my_requests');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleAddVehicle = () => {
    if (!vehNameInput || !vehPlateInput) {
      Alert.alert('خطأ', 'يرجى إدخال اسم السيارة ورقم اللوحة على الأقل');
      return;
    }
    const newVeh: Vehicle = {
      id: `v_${Date.now()}`,
      name: vehNameInput,
      plateNumber: vehPlateInput,
      driverName: vehDriverInput || 'غير محدد',
      type: vehTypeInput || 'شاحنة',
      capacity: vehCapacityInput || 'عام',
      transportType: vehTransportTypeInput || 'عام',
      model: vehModelInput || '2023',
      passengers: vehPassengersInput || '2',
      fuelType: vehFuelTypeInput || 'ديزل',
      status: 'في الخدمة'
    };
    const updated = [...allVehicles, newVeh];
    saveVehiclesLocally(updated);

    const updatedPerms = {
      ...vehiclePermissions,
      [newVeh.id]: { canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true }
    };
    setVehiclePermissions(updatedPerms);
    AsyncStorage.setItem('@vehicle_permissions', JSON.stringify(updatedPerms));

    Alert.alert('تم', 'تمت إضافة السيارة بنجاح إلى النظام');
    setVehNameInput(''); setVehPlateInput(''); setVehDriverInput('');
  };

  const handleAddDriver = () => {
    if (!driverNameInput) {
      Alert.alert('خطأ', 'يرجى إدخال اسم السائق');
      return;
    }
    const newDrv: Driver = {
      id: `d_${Date.now()}`,
      name: driverNameInput,
      phone: driverPhoneInput || 'غير مسجل',
      licenseNumber: driverLicenseInput || 'غير مسجل',
      assignedVehiclePlate: driverVehPlateInput || 'غير محددة'
    };
    const updated = [...drivers, newDrv];
    saveDriversLocally(updated);
    Alert.alert('تم', 'تم إضافة السائق بنجاح');
    setDriverNameInput(''); setDriverPhoneInput(''); setDriverLicenseInput(''); setDriverVehPlateInput('');
  };

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
    setReqProcessNo(''); setReqQuantity(''); setReqPriceAmount(''); setReqAllocation(''); setReqStation(''); setReqNotes('');
  };

  const handleAddCodeItem = (category: keyof CodeCategories) => {
    if (!newCodeInput.trim()) return;
    const updatedCategory = [...codes[category], newCodeInput.trim()];
    const newCodes = { ...codes, [category]: updatedCategory };
    saveCodesLocally(newCodes);
    setNewCodeInput('');
    Alert.alert('تم', 'تم إضافة العنصر بنجاح والتحديث في القوائم المنسدلة.');
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const pendingRequests = requests.filter((r) => r.syncStatus === 'PENDING_PUSH');
      if (pendingRequests.length === 0) {
        Alert.alert('تنبيه', 'لا توجد طلبات معلقة للمزامنة.');
        setIsSyncing(false);
        return;
      }
      const response = await fetch(`${SYNC_API_URL}/push-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: pendingRequests }),
      });

      if (response.ok) {
        const updatedRequests = requests.map(r => r.syncStatus === 'PENDING_PUSH' ? { ...r, syncStatus: 'SYNCED' as const } : r);
        saveRequestsLocally(updatedRequests);
        const now = new Date().toLocaleTimeString('ar-YE');
        setLastSyncTime(now);
        Alert.alert('نجاح', 'تمت المزامنة بنجاح مع سيرفر Oracle.');
      } else {
        Alert.alert('تنبيه', 'تم الحفظ محلياً. تعذر الوصول للسيرفر.');
      }
    } catch (error) {
      Alert.alert('تنبيه', 'تم الحفظ محلياً. تعذر الاتصال بالسيرفر حالياً.');
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePermission = (vehId: string, permKey: keyof VehiclePermission) => {
    const currentVehPerm = vehiclePermissions[vehId] || {
      canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true
    };
    const updated = {
      ...vehiclePermissions,
      [vehId]: {
        ...currentVehPerm,
        [permKey]: !currentVehPerm[permKey]
      }
    };
    setVehiclePermissions(updated);
    AsyncStorage.setItem('@vehicle_permissions', JSON.stringify(updated));
  };

  const handleChangePassword = () => {
    if (!newPasswordInput) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    setUserPassword(newPasswordInput);
    setNewPasswordInput('');
    Alert.alert('نجاح', 'تم تغيير كلمة المرور بنجاح.');
  };

  // شاشة تسجيل الدخول
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.whiteLoginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.whiteLoginCard}>
          <Text style={styles.whiteLoginTitle}>أطلس - إدارة أسطول السيارات</Text>
          <Text style={styles.whiteLoginSubtitle}>تسجيل الدخول للنظام (v1.4.0)</Text>

          <Text style={styles.inputLabel}>اسم المستخدم:</Text>
          <TextInput
            style={styles.whiteInput}
            placeholder="أدخل اسم المستخدم أو رقم السيارة"
            value={loginUsername}
            onChangeText={setLoginUsername}
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>كلمة المرور:</Text>
          <TextInput
            style={styles.whiteInput}
            placeholder="أدخل كلمة المرور"
            secureTextEntry
            value={loginPassword}
            onChangeText={setLoginPassword}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleLogin}>
            <Text style={styles.whiteSubmitBtnText}>تسجيل الدخول 🔑</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* الشريط العلوي للمزامنة */}
      <View style={styles.syncHeader}>
        <TouchableOpacity style={styles.syncBtn} onPress={triggerSync} disabled={isSyncing}>
          {isSyncing ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.syncBtnText}>🔄 مزامنة Oracle</Text>}
        </TouchableOpacity>
        <Text style={styles.syncTimeText}>آخر مزامنة: {lastSyncTime}</Text>
      </View>

      {/* 1. العنوان الرئيسي */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? `السيارة (${userVehicle.plateNumber})` : 'أطلس - لوحة المسؤول'}
        </Text>
      </View>

      {/* 2. شريط الأيقونات / القائمة العلوي */}
      <View style={styles.topBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavScroll}>
          {currentUserRole === 'user' ? (
            <>
              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'my_requests' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('my_requests')}
              >
                <Text style={[styles.topNavText, currentTab === 'my_requests' && styles.activeTopNavText]}>📋 طلباتي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'vehicle_info' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('vehicle_info')}
              >
                <Text style={[styles.topNavText, currentTab === 'vehicle_info' && styles.activeTopNavText]}>🚘 السيارة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'request_service' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('request_service')}
              >
                <Text style={[styles.topNavText, currentTab === 'request_service' && styles.activeTopNavText]}>🛠️ طلب خدمة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'settings' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('settings')}
              >
                <Text style={[styles.topNavText, currentTab === 'settings' && styles.activeTopNavText]}>⚙️ الإعدادات</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_dashboard' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_dashboard')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_dashboard' && styles.activeTopNavText]}>📊 لوحة التحكم</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_coding' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_coding')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_coding' && styles.activeTopNavText]}>🏷️ الترميز والقوائم</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_permissions' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_permissions')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_permissions' && styles.activeTopNavText]}>🔒 الصلاحيات</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.topNavBtn, { backgroundColor: '#FFEBEE' }]} onPress={handleLogout}>
            <Text style={[styles.topNavText, { color: '#D32F2F' }]}>🚪 خروج</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. محتوى الشاشات */}
      <ScrollView style={styles.contentContainer}>

        {/* --- شاشة طلباتي (سائق) --- */}
        {currentTab === 'my_requests' && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.subTabBtn, myRequestsSubTab === t && styles.activeSubTabBtn]}
                  onPress={() => setMyRequestsSubTab(t)}
                >
                  <Text style={[styles.subTabText, myRequestsSubTab === t && styles.activeSubTabText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>سجل طلبات {myRequestsSubTab}</Text>
            {requests.filter(r => r.type === myRequestsSubTab && r.vehicleId === userVehicle.id).length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات مسجلة ضمن هذه الفئة.</Text>
            ) : (
              requests.filter(r => r.type === myRequestsSubTab && r.vehicleId === userVehicle.id).map((req) => (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{req.processNumber}</Text>
                    <Text style={[styles.badge, req.status === 'تم الاعتماد' ? styles.badgeSuccess : styles.badgePending]}>
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.cardDetail}>التاريخ: {req.date}</Text>
                  <Text style={styles.cardDetail}>الكمية/البيان: {req.quantity}</Text>
                  <Text style={styles.cardDetail}>المخصص: {req.allocation}</Text>
                  {req.priceAmount ? <Text style={styles.cardDetail}>المبلغ: {req.priceAmount} ريال</Text> : null}
                  <Text style={styles.syncStatusText}>حالة المزامنة: {req.syncStatus === 'SYNCED' ? '✅ متزامن' : '⏳ معلق محلياً'}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* --- شاشة معلومات السيارة (سائق) --- */}
        {currentTab === 'vehicle_info' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>بيانات السيارة الحالية</Text>
            <View style={styles.divider} />
            <Text style={styles.cardDetail}>اسم السيارة: {userVehicle.name}</Text>
            <Text style={styles.cardDetail}>رقم اللوحة: {userVehicle.plateNumber}</Text>
            <Text style={styles.cardDetail}>السائق المعتمد: {userVehicle.driverName}</Text>
            <Text style={styles.cardDetail}>نوع المركبة: {userVehicle.type}</Text>
            <Text style={styles.cardDetail}>الحمولة/السعة: {userVehicle.capacity}</Text>
            <Text style={styles.cardDetail}>الموديل: {userVehicle.model}</Text>
            <Text style={styles.cardDetail}>نوع الوقود: {userVehicle.fuelType}</Text>
            <Text style={styles.cardDetail}>حالة السيارة: {userVehicle.status}</Text>
          </View>
        )}

        {/* --- شاشة تقديم طلب خدمة (سائق) --- */}
        {currentTab === 'request_service' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إنشاء طلب مصروف جديد</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.subTabBtn, serviceSubTab === t && styles.activeSubTabBtn]}
                  onPress={() => setServiceSubTab(t)}
                >
                  <Text style={[styles.subTabText, serviceSubTab === t && styles.activeSubTabText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>رقم العملية / الفاتورة:</Text>
            <TextInput style={styles.whiteInput} value={reqProcessNo} onChangeText={setReqProcessNo} placeholder="أدخل رقم العملية" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>الكمية / التفاصيل:</Text>
            <TextInput style={styles.whiteInput} value={reqQuantity} onChangeText={setReqQuantity} placeholder="الكمية باللتر أو عدد القطع" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>المبلغ الإجمالي (ريال):</Text>
            <TextInput style={styles.whiteInput} value={reqPriceAmount} onChangeText={setReqPriceAmount} keyboardType="numeric" placeholder="المبلغ" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>المخصص / خط السير:</Text>
            <TextInput style={styles.whiteInput} value={reqAllocation} onChangeText={setReqAllocation} placeholder="مثال: رحلة تعز - عدن" placeholderTextColor="#999" />

            {serviceSubTab === 'وقود' && (
              <>
                <Text style={styles.inputLabel}>المحطة:</Text>
                <TextInput style={styles.whiteInput} value={reqStation} onChangeText={setReqStation} placeholder="اسم المحطة" placeholderTextColor="#999" />
              </>
            )}

            <Text style={styles.inputLabel}>ملاحظات إضافية:</Text>
            <TextInput style={styles.whiteInput} value={reqNotes} onChangeText={setReqNotes} placeholder="أي ملاحظات" placeholderTextColor="#999" />

            <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => handleCreateRequest(serviceSubTab)}>
              <Text style={styles.whiteSubmitBtnText}>إرسال الطلب 📤</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- شاشة الإعدادات وتغيير كلمة المرور (سائق) --- */}
        {currentTab === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تغيير كلمة المرور</Text>
            <Text style={styles.inputLabel}>كلمة المرور الجديدة:</Text>
            <TextInput
              style={styles.whiteInput}
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
              secureTextEntry
              placeholder="أدخل كلمة المرور الجديدة"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleChangePassword}>
              <Text style={styles.whiteSubmitBtnText}>حفظ كلمة المرور الجديدة 🔐</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- لوحة تحكم المسؤول (ADMIN DASHBOARD) --- */}
        {currentTab === 'admin_dashboard' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة أسطول السيارات والسائقين</Text>

            <View style={styles.subTabRow}>
              <TouchableOpacity
                style={[styles.subTabBtn, dashboardSubTab === 'add_vehicle' && styles.activeSubTabBtn]}
                onPress={() => setDashboardSubTab('add_vehicle')}
              >
                <Text style={[styles.subTabText, dashboardSubTab === 'add_vehicle' && styles.activeSubTabText]}>إضافة سيارة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subTabBtn, dashboardSubTab === 'add_driver' && styles.activeSubTabBtn]}
                onPress={() => setDashboardSubTab('add_driver')}
              >
                <Text style={[styles.subTabText, dashboardSubTab === 'add_driver' && styles.activeSubTabText]}>إضافة سائق</Text>
              </TouchableOpacity>
            </View>

            {dashboardSubTab === 'add_vehicle' && (
              <View>
                <Text style={styles.sectionTitle}>إضافة سيارة جديدة</Text>
                <TextInput style={styles.whiteInput} placeholder="اسم السيارة" value={vehNameInput} onChangeText={setVehNameInput} placeholderTextColor="#999" />
                <TextInput style={styles.whiteInput} placeholder="رقم اللوحة" value={vehPlateInput} onChangeText={setVehPlateInput} placeholderTextColor="#999" />
                <TextInput style={styles.whiteInput} placeholder="اسم السائق المعتمد" value={vehDriverInput} onChangeText={setVehDriverInput} placeholderTextColor="#999" />
                <TextInput style={styles.whiteInput} placeholder="نوع المركبة" value={vehTypeInput} onChangeText={setVehTypeInput} placeholderTextColor="#999" />
                <TextInput style={styles.whiteInput} placeholder="الحمولة / السعة" value={vehCapacityInput} onChangeText={setVehCapacityInput} placeholderTextColor="#999" />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleAddVehicle}>
                  <Text style={styles.whiteSubmitBtnText}>إضافة السيارة للنظام ➕</Text>
                </TouchableOpacity>
              </View>
            )}

            {dashboardSubTab === 'add_driver' && (
              <View>
                <Text style={styles.sectionTitle}>إضافة سائق جديد</Text>
                <TextInput style={styles.whiteInput} placeholder="اسم السائق الثلاثي" value={driverNameInput} onChangeText={setDriverNameInput} placeholderTextColor="#999" />
                <TextInput style={styles.whiteInput} placeholder="رقم الهاتف" value={driverPhoneInput} onChangeText={setDriverPhoneInput} placeholderTextColor="#999" />
                <TextInput style={styles.whiteInput} placeholder="رقم الرخصة" value={driverLicenseInput} onChangeText={setDriverLicenseInput} placeholderTextColor="#999" />
                <TextInput style={styles.whiteInput} placeholder="رقم لوحة السيارة المرتبطة" value={driverVehPlateInput} onChangeText={setDriverVehPlateInput} placeholderTextColor="#999" />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleAddDriver}>
                  <Text style={styles.whiteSubmitBtnText}>إضافة السائق ➕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* --- شاشة الترميز والقوائم (ADMIN CODING) --- */}
        {currentTab === 'admin_coding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة رموز وقوائم النظام</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              {(['stations', 'fuelTypes', 'oils', 'tires', 'batteries', 'spareParts', 'allocations'] as (keyof CodeCategories)[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.subTabBtn, codingSubTab === cat && styles.activeSubTabBtn]}
                  onPress={() => setCodingSubTab(cat)}
                >
                  <Text style={[styles.subTabText, codingSubTab === cat && styles.activeSubTabText]}>
                    {cat === 'stations' ? 'المحطات' : cat === 'fuelTypes' ? 'الوقود' : cat === 'oils' ? 'الزيوت' : cat === 'tires' ? 'الإطارات' : cat === 'batteries' ? 'البطاريات' : cat === 'spareParts' ? 'قطع الغيار' : 'المخصصات'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>إضافة عنصر جديد:</Text>
            <TextInput
              style={styles.whiteInput}
              value={newCodeInput}
              onChangeText={setNewCodeInput}
              placeholder="اكتب الاسم هنا..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => handleAddCodeItem(codingSubTab)}>
              <Text style={styles.whiteSubmitBtnText}>إضافة للقائمة ➕</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>العناصر المسجلة حالياً:</Text>
            {codes[codingSubTab]?.map((item, idx) => (
              <View key={idx} style={styles.codeItemRow}>
                <Text style={styles.codeItemText}>• {item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* --- شاشة إدارة الصلاحيات (ADMIN PERMISSIONS) --- */}
        {currentTab === 'admin_permissions' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تحكم في صلاحيات طلبات السيارات</Text>

            {allVehicles.map((v) => {
              const perms = vehiclePermissions[v.id] || { canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true };
              return (
                <View key={v.id} style={styles.permCard}>
                  <Text style={styles.permVehTitle}>{v.name} ({v.plateNumber})</Text>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>طلب الوقود:</Text>
                    <Switch value={perms.canRequestFuel} onValueChange={() => togglePermission(v.id, 'canRequestFuel')} />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>طلب الزيوت:</Text>
                    <Switch value={perms.canRequestOils} onValueChange={() => togglePermission(v.id, 'canRequestOils')} />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>طلب الإطارات:</Text>
                    <Switch value={perms.canRequestTires} onValueChange={() => togglePermission(v.id, 'canRequestTires')} />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>طلب البطاريات:</Text>
                    <Switch value={perms.canRequestBatteries} onValueChange={() => togglePermission(v.id, 'canRequestBatteries')} />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>طلب الصيانة:</Text>
                    <Switch value={perms.canRequestMaintenance} onValueChange={() => togglePermission(v.id, 'canRequestMaintenance')} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  whiteLoginContainer: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 20 },
  whiteLoginCard: { width: '100%', maxWidth: 400, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 3, boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
  whiteLoginTitle: { fontSize: 22, fontWeight: 'bold', color: '#0D47A1', textAlign: 'center', marginBottom: 5 },
  whiteLoginSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  syncHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0D47A1', paddingHorizontal: 15, paddingVertical: 8 },
  syncBtn: { backgroundColor: '#1976D2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  syncBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  syncTimeText: { color: '#E3F2FD', fontSize: 11 },
  header: { backgroundColor: '#1565C0', padding: 15, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  topBarContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  topNavScroll: { flexDirection: 'row-reverse', paddingHorizontal: 10, paddingVertical: 8 },
  topNavBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4, backgroundColor: '#F0F2F5' },
  activeTopNavBtn: { backgroundColor: '#0D47A1' },
  topNavText: { fontSize: 13, color: '#424242', fontWeight: 'bold' },
  activeTopNavText: { color: '#FFFFFF' },
  contentContainer: { flex: 1, padding: 15 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'right', marginTop: 10, marginBottom: 8 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  badgeSuccess: { backgroundColor: '#2E7D32' },
  badgePending: { backgroundColor: '#ED6C02' },
  cardDetail: { fontSize: 13, color: '#444', textAlign: 'right', marginBottom: 4 },
  syncStatusText: { fontSize: 11, color: '#757575', textAlign: 'right', marginTop: 5 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
  subTabScroll: { flexDirection: 'row-reverse', marginBottom: 12 },
  subTabRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginBottom: 15 },
  subTabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#E0E0E0', marginHorizontal: 3 },
  activeSubTabBtn: { backgroundColor: '#1976D2' },
  subTabText: { fontSize: 12, color: '#333' },
  activeSubTabText: { color: '#FFF', fontWeight: 'bold' },
  inputLabel: { fontSize: 13, color: '#333', textAlign: 'right', marginTop: 8, marginBottom: 4, fontWeight: '600' },
  whiteInput: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 14, textAlign: 'right', marginBottom: 10, color: '#333' },
  whiteSubmitBtn: { backgroundColor: '#0D47A1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  whiteSubmitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20, fontSize: 13 },
  codeItemRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  codeItemText: { fontSize: 13, color: '#333', textAlign: 'right' },
  permCard: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E9ECEF' },
  permVehTitle: { fontSize: 14, fontWeight: 'bold', color: '#1565C0', textAlign: 'right', marginBottom: 8 },
  switchRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  switchLabel: { fontSize: 13, color: '#333' }
});

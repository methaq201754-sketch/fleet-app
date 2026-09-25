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
  const [codingSubTab, setCodingSubTab] = useState<string>('stations');
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  // معالجة لوحة التحكم (إضافة وتعديل السيارات والسائقين)
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

    // إضافة صلاحيات افتراضية
    const updatedPerms = {
      ...vehiclePermissions,
      [newVeh.id]: { canRequestFuel: true, canRequestOils: true, canRequestTires: true, canRequestBatteries: true, canRequestMaintenance: true }
    };
    setVehiclePermissions(updatedPerms);
    AsyncStorage.setItem('@vehicle_permissions', JSON.stringify(updatedPerms));

    Alert.alert('تم', 'تمت إضافة السيارة بنجاح إلى النظام');
    setVehNameInput(''); setVehPlateInput(''); setVehDriverInput('');
  };

  const handleEditVehicle = () => {
    const updated = allVehicles.map(v => {
      if (v.id === selectedVehForEdit) {
        return {
          ...v,
          name: vehNameInput || v.name,
          plateNumber: vehPlateInput || v.plateNumber,
          driverName: vehDriverInput || v.driverName,
          type: vehTypeInput || v.type,
          capacity: vehCapacityInput || v.capacity,
          model: vehModelInput || v.model,
          fuelType: vehFuelTypeInput || v.fuelType
        };
      }
      return v;
    });
    saveVehiclesLocally(updated);
    Alert.alert('تم', 'تم حفظ تعديلات بيانات السيارة بنجاح.');
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

  const handleEditDriver = () => {
    const updated = drivers.map(d => {
      if (d.id === selectedDriverForEdit) {
        return {
          ...d,
          name: driverNameInput || d.name,
          phone: driverPhoneInput || d.phone,
          licenseNumber: driverLicenseInput || d.licenseNumber,
          assignedVehiclePlate: driverVehPlateInput || d.assignedVehiclePlate
        };
      }
      return d;
    });
    saveDriversLocally(updated);
    Alert.alert('تم', 'تم حفظ بيانات السائق بنجاح');
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

  // شاشة تسجيل الدخول بالخلفية البيضاء المحدثة
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.whiteLoginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.whiteLoginCard}>
          <Text style={styles.whiteLoginTitle}>أطلس - إدارة أسطول السيارات</Text>
          <Text style={styles.whiteLoginSubtitle}>تسجيل الدخول للنظام (v1.3.0)</Text>

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

      {/* 2. شريط الأيقونات / القائمة في الأعلى أسفل العنوان مباشَرة */}
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
                <Text style={[styles.topNavText, currentTab === 'admin_dashboard' && styles.activeTopNavText]}>🎛️ لوحة التحكم</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'drivers_list' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('drivers_list')}
              >
                <Text style={[styles.topNavText, currentTab === 'drivers_list' && styles.activeTopNavText]}>👨‍✈️ قائمة السائقين</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_requests' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_requests')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_requests' && styles.activeTopNavText]}>🔔 الطلبات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'user_permissions' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('user_permissions')}
              >
                <Text style={[styles.topNavText, currentTab === 'user_permissions' && styles.activeTopNavText]}>🔑 الصلاحيات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'coding_screen' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('coding_screen')}
              >
                <Text style={[styles.topNavText, currentTab === 'coding_screen' && styles.activeTopNavText]}>🏷️ التكويد</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.logoutTopBtn} onPress={handleLogout}>
            <Text style={styles.logoutTopText}>خروج 🚪</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ===================== واجهات المستخدم العادي ===================== */}
        {currentUserRole === 'user' && (
          <>
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

                  {serviceSubTab === 'وقود' && (
                    <>
                      <Text style={styles.inputLabel}>اختر نوع الوقود:</Text>
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

                  <Text style={styles.inputLabel}>اختر اسم المحطة / الورشة:</Text>
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

                  <Text style={styles.inputLabel}>اختر المخصص:</Text>
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

            {currentTab === 'settings' && (
              <View>
                <Text style={styles.sectionTitle}>⚙️ إعدادات الحساب</Text>
                <View style={styles.card}>
                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>اسم السيارة: {userVehicle.name}</Text>
                    <TouchableOpacity onPress={() => setEditingField('name')}>
                      <Text style={styles.penIcon}>✏️ تعديل</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>رقم السيارة: {userVehicle.plateNumber}</Text>
                    <TouchableOpacity onPress={() => setEditingField('plate')}>
                      <Text style={styles.penIcon}>✏️ تعديل</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>اسم السائق: {userVehicle.driverName}</Text>
                    <TouchableOpacity onPress={() => setEditingField('driver')}>
                      <Text style={styles.penIcon}>✏️ تعديل</Text>
                    </TouchableOpacity>
                  </View>

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

        {/* ===================== واجهات المسؤول (ADMIN) ===================== */}
        {currentUserRole === 'admin' && (
          <>
            {/* 1. لوحة التحكم بالأيقونات المطلوبة */}
            {currentTab === 'admin_dashboard' && (
              <View>
                <Text style={styles.sectionTitle}>🎛️ لوحة تحكم المسؤول</Text>

                <View style={styles.subTabRow}>
                  {[
                    { key: 'add_vehicle', label: '➕ إضافة سيارة' },
                    { key: 'edit_vehicle', label: '✏️ تعديل سيارة' },
                    { key: 'add_driver', label: '➕ إضافة سائق' },
                    { key: 'edit_driver', label: '✏️ تعديل سائق' },
                  ].map((btn) => (
                    <TouchableOpacity
                      key={btn.key}
                      style={[styles.subTabBtn, dashboardSubTab === btn.key && styles.activeSubTabBtn]}
                      onPress={() => setDashboardSubTab(btn.key)}
                    >
                      <Text style={[styles.subTabBtnText, dashboardSubTab === btn.key && styles.activeSubTabBtnText]}>
                        {btn.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {dashboardSubTab === 'add_vehicle' && (
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>إضافة سيارة جديدة لأسطول الشركة</Text>
                    <Text style={styles.inputLabel}>اسم السيارة / المعدة:</Text>
                    <TextInput style={styles.input} placeholder="مثال: شاحنة نقل جاف" value={vehNameInput} onChangeText={setVehNameInput} />

                    <Text style={styles.inputLabel}>رقم اللوحة:</Text>
                    <TextInput style={styles.input} placeholder="مثال: 1010-أ" value={vehPlateInput} onChangeText={setVehPlateInput} />

                    <Text style={styles.inputLabel}>اسم السائق المرفق:</Text>
                    <TextInput style={styles.input} placeholder="أدخل اسم السائق" value={vehDriverInput} onChangeText={setVehDriverInput} />

                    <Text style={styles.inputLabel}>نوع السيارة:</Text>
                    <TextInput style={styles.input} placeholder="مثال: شاحنة كبيرة / دينا" value={vehTypeInput} onChangeText={setVehTypeInput} />

                    <Text style={styles.inputLabel}>الحمولة:</Text>
                    <TextInput style={styles.input} placeholder="مثال: 15 طن" value={vehCapacityInput} onChangeText={setVehCapacityInput} />

                    <Text style={styles.inputLabel}>نوع النقل:</Text>
                    <TextInput style={styles.input} placeholder="مثال: بضائع / طلاء" value={vehTransportTypeInput} onChangeText={setVehTransportTypeInput} />

                    <Text style={styles.inputLabel}>الموديل:</Text>
                    <TextInput style={styles.input} placeholder="مثال: 2022" value={vehModelInput} onChangeText={setVehModelInput} />

                    <Text style={styles.inputLabel}>نوع الوقود:</Text>
                    <TextInput style={styles.input} placeholder="ديزل / بنزين" value={vehFuelTypeInput} onChangeText={setVehFuelTypeInput} />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleAddVehicle}>
                      <Text style={styles.submitBtnText}>حفظ وإضافة السيارة 🚗</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {dashboardSubTab === 'edit_vehicle' && (
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>تعديل بيانات سيارة مسجلة</Text>
                    <Text style={styles.inputLabel}>اختر السيارة للتعديل:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                      {allVehicles.map((v) => (
                        <TouchableOpacity
                          key={v.id}
                          style={[styles.chipBtn, selectedVehForEdit === v.id && styles.chipBtnActive]}
                          onPress={() => {
                            setSelectedVehForEdit(v.id);
                            setVehNameInput(v.name);
                            setVehPlateInput(v.plateNumber);
                            setVehDriverInput(v.driverName);
                            setVehTypeInput(v.type);
                            setVehCapacityInput(v.capacity);
                            setVehModelInput(v.model);
                            setVehFuelTypeInput(v.fuelType);
                          }}
                        >
                          <Text style={[styles.chipText, selectedVehForEdit === v.id && styles.chipTextActive]}>
                            {v.name} ({v.plateNumber})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.inputLabel}>تعديل الاسم:</Text>
                    <TextInput style={styles.input} value={vehNameInput} onChangeText={setVehNameInput} />

                    <Text style={styles.inputLabel}>تعديل رقم اللوحة:</Text>
                    <TextInput style={styles.input} value={vehPlateInput} onChangeText={setVehPlateInput} />

                    <Text style={styles.inputLabel}>تعديل السائق:</Text>
                    <TextInput style={styles.input} value={vehDriverInput} onChangeText={setVehDriverInput} />

                    <Text style={styles.inputLabel}>تعديل نوع الوقود:</Text>
                    <TextInput style={styles.input} value={vehFuelTypeInput} onChangeText={setVehFuelTypeInput} />

                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#2E7D32' }]} onPress={handleEditVehicle}>
                      <Text style={styles.submitBtnText}>حفظ التغييرات 💾</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {dashboardSubTab === 'add_driver' && (
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>إضافة سائق جديد للنظام</Text>
                    <Text style={styles.inputLabel}>اسم السائق الكامل:</Text>
                    <TextInput style={styles.input} placeholder="أدخل اسم السائق" value={driverNameInput} onChangeText={setDriverNameInput} />

                    <Text style={styles.inputLabel}>رقم الهاتف:</Text>
                    <TextInput style={styles.input} placeholder="أدخل رقم الهاتف" value={driverPhoneInput} onChangeText={setDriverPhoneInput} keyboardType="phone-pad" />

                    <Text style={styles.inputLabel}>رقم الرخصة:</Text>
                    <TextInput style={styles.input} placeholder="أدخل رقم الرخصة" value={driverLicenseInput} onChangeText={setDriverLicenseInput} />

                    <Text style={styles.inputLabel}>رقم السيارة المربوط بها:</Text>
                    <TextInput style={styles.input} placeholder="مثال: 1010-أ" value={driverVehPlateInput} onChangeText={setDriverVehPlateInput} />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleAddDriver}>
                      <Text style={styles.submitBtnText}>إضافة السائق 👨‍✈️</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {dashboardSubTab === 'edit_driver' && (
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>تعديل بيانات سائق</Text>
                    <Text style={styles.inputLabel}>اختر السائق المراد تعديله:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                      {drivers.map((d) => (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.chipBtn, selectedDriverForEdit === d.id && styles.chipBtnActive]}
                          onPress={() => {
                            setSelectedDriverForEdit(d.id);
                            setDriverNameInput(d.name);
                            setDriverPhoneInput(d.phone);
                            setDriverLicenseInput(d.licenseNumber);
                            setDriverVehPlateInput(d.assignedVehiclePlate);
                          }}
                        >
                          <Text style={[styles.chipText, selectedDriverForEdit === d.id && styles.chipTextActive]}>
                            {d.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.inputLabel}>تعديل الاسم:</Text>
                    <TextInput style={styles.input} value={driverNameInput} onChangeText={setDriverNameInput} />

                    <Text style={styles.inputLabel}>تعديل رقم الهاتف:</Text>
                    <TextInput style={styles.input} value={driverPhoneInput} onChangeText={setDriverPhoneInput} keyboardType="phone-pad" />

                    <Text style={styles.inputLabel}>تعديل رقم السيارة المربوطة:</Text>
                    <TextInput style={styles.input} value={driverVehPlateInput} onChangeText={setDriverVehPlateInput} />

                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#2E7D32' }]} onPress={handleEditDriver}>
                      <Text style={styles.submitBtnText}>تحديث بيانات السائق 💾</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* 2. أيقونة وشاشة قائمة السائقين */}
            {currentTab === 'drivers_list' && (
              <View>
                <Text style={styles.sectionTitle}>👨‍✈️ قائمة السائقين المسجلين</Text>
                {drivers.length === 0 ? (
                  <Text style={styles.emptyText}>لا يوجد سائقين مسجلين حالياً</Text>
                ) : (
                  drivers.map((drv) => (
                    <View key={drv.id} style={styles.card}>
                      <Text style={styles.cardTitle}>اسم السائق: {drv.name}</Text>
                      <Text style={styles.cardDetail}>📱 رقم الهاتف: {drv.phone}</Text>
                      <Text style={styles.cardDetail}>🪪 رقم الرخصة: {drv.licenseNumber}</Text>
                      <Text style={styles.cardDetail}>🚚 السيارة المربوطة: {drv.assignedVehiclePlate}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // تسجيل الدخول بخلفية بيضاء
  whiteLoginContainer: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 24 },
  whiteLoginCard: { backgroundColor: '#FFFFFF', padding: 20 },
  whiteLoginTitle: { fontSize: 22, fontWeight: 'bold', color: '#0D47A1', textAlign: 'center', marginBottom: 4 },
  whiteLoginSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 28 },
  whiteInput: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, marginTop: 6, textAlign: 'right', color: '#333' },
  whiteSubmitBtn: { backgroundColor: '#0D47A1', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  whiteSubmitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },

  container: { flex: 1, backgroundColor: '#F5F7FA' },
  syncHeader: { backgroundColor: '#1565C0', padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  syncBtn: { backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  syncBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  syncTimeText: { color: '#E3F2FD', fontSize: 11 },
  header: { backgroundColor: '#0D47A1', padding: 12, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // الشريط العلوي للتنقل المُموضع في الأعلى
  topBarContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E0E0E0', paddingVertical: 6 },
  topNavScroll: { flexDirection: 'row-reverse', paddingHorizontal: 10, alignItems: 'center' },
  topNavBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4, backgroundColor: '#F0F4F8' },
  activeTopNavBtn: { backgroundColor: '#0D47A1' },
  topNavText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  activeTopNavText: { color: '#FFFFFF' },
  logoutTopBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  logoutTopText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  scrollContent: { padding: 16, paddingBottom: 40 },
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
  formCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 15, elevation: 2 },
  submitBtn: { backgroundColor: '#0D47A1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  editRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  penIcon: { fontSize: 13, color: '#0D47A1', fontWeight: 'bold' },
  inlineEditBox: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8, marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20 },
  permRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }
});

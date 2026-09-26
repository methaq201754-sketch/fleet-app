import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';

/* ============================================================
   1. الواجهات وأنواع البيانات (Types & Interfaces)
   ============================================================ */

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  status: 'فعال' | 'موقوف';
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  name: string;
  driverName: string;
  status: 'نشط' | 'صيانة' | 'متوقف';
  lastOdometer?: number;
}

export interface DriverBinding {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  startDate: string;
  endDate: string;
  status: 'نشط' | 'منتهي';
}

export interface ServiceRequest {
  id: string;
  processNumber: string;
  vehiclePlate: string;
  driverName: string;
  type: string;
  quantity: string;
  priceAmount: string;
  date: string;
  status: 'قيد الانتظار' | 'تم الاعتماد' | 'مرفوض';
  notes?: string;
  fuelType?: string;
  oilType?: string;
  prevOdometer?: string;
  currentOdometer?: string;
  distanceTraveled?: string;
}

export interface CodeCategories {
  spareParts: string[];
  oils: string[];
  allocations: string[];
  batteries: string[];
  stations: string[];
  tires: string[];
  fuelTypes: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  username: string;
  date: string;
}

type PermissionKey =
  | 'manageRequests'
  | 'editVehicles'
  | 'editDrivers'
  | 'manageBindings'
  | 'editCoding'
  | 'manageUsers';

const SYNC_API_URL = 'https://api.atlas-fleet.com/sync';

/* ============================================================
   2. المكون الرئيسي للتطبيق
   ============================================================ */

export default function App() {
  // --- حالة تسجيل الدخول والمستخدم الحالي ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user'>('admin');
  const [currentUsername, setCurrentUsername] = useState<string>('ميثاق');

  // --- التبويب الحالي ---
  const [currentTab, setCurrentTab] = useState<string>('admin_dashboard');

  // --- البيانات الأساسية ---
  const [drivers, setDrivers] = useState<User[]>([
    { id: '1', username: 'methaq', name: 'ميثاق عبده', role: 'admin', status: 'فعال' },
    { id: '2', username: 'driver1', name: 'أحمد علي', role: 'user', status: 'فعال' },
    { id: '3', username: 'driver2', name: 'محمد حسن', role: 'user', status: 'فعال' }
  ]);

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([
    { id: 'v1', plateNumber: '1234-أ', name: 'تويوتا هيلوكس', driverName: 'أحمد علي', status: 'نشط', lastOdometer: 150000 },
    { id: 'v2', plateNumber: '5678-ب', name: 'شاحنة إيسوزو', driverName: 'محمد حسن', status: 'نشط', lastOdometer: 82000 }
  ]);

  const [bindings, setBindings] = useState<DriverBinding[]>([
    {
      id: 'b1',
      driverId: '2',
      driverName: 'أحمد علي',
      vehicleId: 'v1',
      vehiclePlate: '1234-أ',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'نشط'
    }
  ]);

  const [requests, setRequests] = useState<ServiceRequest[]>([
    {
      id: 'r1',
      processNumber: 'REQ-1001',
      vehiclePlate: '1234-أ',
      driverName: 'أحمد علي',
      type: 'وقود',
      quantity: '50 لتر',
      priceAmount: '25000',
      date: '2026-09-20',
      status: 'قيد الانتظار',
      notes: 'تعبئة ديزل للمهمة'
    }
  ]);

  // --- التكويدات والأسعار ---
  const [codes, setCodes] = useState<CodeCategories>({
    spareParts: ['فلاتر', 'سيور', 'فحمات فرامل'],
    oils: ['زيت محرك 10W40', 'زيت جير', 'زيت فرامل'],
    allocations: ['الإدارة العامة', 'الخدمات اللوجستية', 'المبيعات'],
    batteries: ['بطارية 70 أمبير', 'بطارية 100 أمبير'],
    stations: ['محطة النموذجية', 'محطة الساحل'],
    tires: ['إطار مقاس 16', 'إطار مقاس 22.5'],
    fuelTypes: ['ديزل', 'بنزين ممتاز', 'بنزين عادي']
  });

  const [itemPrices, setItemPrices] = useState<Record<string, string>>({
    'ديزل': '500',
    'بنزين ممتاز': '600',
    'زيت محرك 10W40': '3500'
  });

  // --- الصلاحيات المخصصة لكل مستخدم ---
  const [userPermissions, setUserPermissions] = useState<Record<string, PermissionKey[]>>({
    methaq: ['manageRequests', 'editVehicles', 'editDrivers', 'manageBindings', 'editCoding', 'manageUsers'],
    driver1: []
  });

  // --- سجلات التغيير (Audit Logs) ---
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'l1',
      action: 'تسجيل دخول',
      details: 'تم تسجيل الدخول بنجاح',
      username: 'methaq',
      date: new Date().toISOString()
    }
  ]);

  // --- حالة المزامنة ---
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // --- حقول نماذج الإدخال والفلترة ---
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleFormPlate, setVehicleFormPlate] = useState('');
  const [vehicleFormName, setVehicleFormName] = useState('');
  const [vehicleFormDriver, setVehicleFormDriver] = useState('');

  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverUsername, setNewDriverUsername] = useState('');

  const [bindingDriverId, setBindingDriverId] = useState('');
  const [bindingVehicleId, setBindingVehicleId] = useState('');
  const [bindingStartDate, setBindingStartDate] = useState('');
  const [bindingEndDate, setBindingEndDate] = useState('');

  const [codingSubTab, setCodingSubTab] = useState<'prices' | keyof CodeCategories>('prices');
  const [newCodeInput, setNewCodeInput] = useState('');
  const [priceItemSelect, setPriceItemSelect] = useState('');
  const [priceValueInput, setPriceValueInput] = useState('');

  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqFuelType, setReqFuelType] = useState('ديزل');
  const [reqOilType, setReqOilType] = useState('زيت محرك 10W40');
  const [reqPrevOdometer, setReqPrevOdometer] = useState('0');
  const [reqCurrentOdometer, setReqCurrentOdometer] = useState('0');
  const [reqDistanceTraveled, setReqDistanceTraveled] = useState('0');
  const [serviceSubTab, setServiceSubTab] = useState('وقود');

  // --- بيانات سيارة السائق الحالي ---
  const userVehicle = allVehicles[0] || {
    id: 'v1',
    plateNumber: '1234-أ',
    name: 'تويوتا هيلوكس',
    driverName: currentUsername,
    status: 'نشط'
  };

  /* ============================================================
     3. الدوال المساعدة والأحداث (Handlers & Helpers)
     ============================================================ */

  const addLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      action,
      details,
      username: currentUsername,
      date: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (currentUserRole === 'admin') return true;
    const userPerms = userPermissions[currentUsername] || [];
    return userPerms.includes(permission);
  };

  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المستخدم');
      return;
    }
    setIsLoggedIn(true);
    setCurrentUsername(loginUsername);
    if (loginUsername.toLowerCase() === 'admin' || loginUsername.toLowerCase() === 'methaq') {
      setCurrentUserRole('admin');
      setCurrentTab('admin_dashboard');
    } else {
      setCurrentUserRole('user');
      setCurrentTab('my_requests');
    }
    addLog('تسجيل دخول', `تم دخول المستخدم ${loginUsername}`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  // --- إحصائيات لوحة التحكم ---
  const totalVehicles = allVehicles.length;
  const totalDrivers = drivers.length;
  const pendingRequestsCount = requests.filter(r => r.status === 'قيد الانتظار').length;
  const totalExpenses = requests
    .filter(r => r.status === 'تم الاعتماد')
    .reduce((sum, r) => sum + (parseFloat(r.priceAmount) || 0), 0);

  // --- تصفية البحث ---
  const filteredVehicles = allVehicles.filter(v =>
    v.plateNumber.includes(vehicleSearch) ||
    v.name.includes(vehicleSearch) ||
    v.driverName.includes(vehicleSearch)
  );

  const filteredDrivers = drivers.filter(d =>
    d.name.includes(driverSearch) || d.username.includes(driverSearch)
  );

  // --- إدارة السيارات ---
  const saveVehicle = () => {
    if (!vehicleFormPlate || !vehicleFormName) {
      Alert.alert('تنبيه', 'يرجى تعبئة اللوحة والاسم');
      return;
    }
    if (editingVehicleId) {
      setAllVehicles(prev =>
        prev.map(v =>
          v.id === editingVehicleId
            ? { ...v, plateNumber: vehicleFormPlate, name: vehicleFormName, driverName: vehicleFormDriver }
            : v
        )
      );
      addLog('تعديل سيارة', `تم تعديل السيارة ${vehicleFormPlate}`);
      setEditingVehicleId(null);
    } else {
      const newV: Vehicle = {
        id: Date.now().toString(),
        plateNumber: vehicleFormPlate,
        name: vehicleFormName,
        driverName: vehicleFormDriver || 'غير محدد',
        status: 'نشط'
      };
      setAllVehicles(prev => [...prev, newV]);
      addLog('إضافة سيارة', `تم إضافة السيارة ${vehicleFormPlate}`);
    }
    setVehicleFormPlate('');
    setVehicleFormName('');
    setVehicleFormDriver('');
  };

  const startEditVehicle = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setVehicleFormPlate(v.plateNumber);
    setVehicleFormName(v.name);
    setVehicleFormDriver(v.driverName);
  };

  const cancelVehicleEdit = () => {
    setEditingVehicleId(null);
    setVehicleFormPlate('');
    setVehicleFormName('');
    setVehicleFormDriver('');
  };

  // --- إدارة السائقين ---
  const addDriver = () => {
    if (!newDriverName || !newDriverUsername) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم السائق واسم المستخدم');
      return;
    }
    const newD: User = {
      id: Date.now().toString(),
      name: newDriverName,
      username: newDriverUsername,
      role: 'user',
      status: 'فعال'
    };
    setDrivers(prev => [...prev, newD]);
    addLog('إضافة سائق', `تم إضافة السائق ${newDriverName}`);
    setNewDriverName('');
    setNewDriverUsername('');
  };

  const toggleDriverStatus = (driver: User) => {
    const updatedStatus = driver.status === 'فعال' ? 'موقوف' : 'فعال';
    setDrivers(prev =>
      prev.map(d => (d.id === driver.id ? { ...d, status: updatedStatus } : d))
    );
    addLog('تغيير حالة سائق', `تم تغيير حالة ${driver.name} إلى ${updatedStatus}`);
  };

  // --- ربط السائقين ---
  const createBinding = () => {
    if (!bindingDriverId || !bindingVehicleId) {
      Alert.alert('تنبيه', 'يرجى اختيار السائق والسيارة');
      return;
    }
    const driverObj = drivers.find(d => d.id === bindingDriverId);
    const vehicleObj = allVehicles.find(v => v.id === bindingVehicleId);

    const newB: DriverBinding = {
      id: Date.now().toString(),
      driverId: bindingDriverId,
      driverName: driverObj?.name || '',
      vehicleId: bindingVehicleId,
      vehiclePlate: vehicleObj?.plateNumber || '',
      startDate: bindingStartDate || new Date().toISOString().split('T')[0],
      endDate: bindingEndDate || '2026-12-31',
      status: 'نشط'
    };
    setBindings(prev => [...prev, newB]);
    addLog('ربط سائق سيارة', `تم ربط ${driverObj?.name} بالسيارة ${vehicleObj?.plateNumber}`);
    setBindingDriverId('');
    setBindingVehicleId('');
    setBindingStartDate('');
    setBindingEndDate('');
  };

  const deleteBinding = (id: string) => {
    setBindings(prev => prev.filter(b => b.id !== id));
    addLog('حذف ربط', `تم حذف عملية الربط رقم ${id}`);
  };

  // --- التكويدات والأسعار ---
  const addNewCode = () => {
    if (!newCodeInput || codingSubTab === 'prices') return;
    setCodes(prev => ({
      ...prev,
      [codingSubTab]: [...prev[codingSubTab as keyof CodeCategories], newCodeInput]
    }));
    addLog('إضافة تكويد', `تم إضافة ${newCodeInput} في ${codingSubTab}`);
    setNewCodeInput('');
  };

  const deleteCode = (category: keyof CodeCategories, item: string) => {
    setCodes(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
    addLog('حذف تكويد', `تم حذف ${item} من ${category}`);
  };

  const handleSavePrice = () => {
    if (!priceItemSelect || !priceValueInput) return;
    setItemPrices(prev => ({
      ...prev,
      [priceItemSelect]: priceValueInput
    }));
    addLog('تعديل سعر', `تم تحديث سعر ${priceItemSelect} إلى ${priceValueInput}`);
    setPriceItemSelect('');
    setPriceValueInput('');
  };

  // --- الصلاحيات ---
  const allPermissions: PermissionKey[] = [
    'manageRequests',
    'editVehicles',
    'editDrivers',
    'manageBindings',
    'editCoding',
    'manageUsers'
  ];

  const permissionNames: Record<PermissionKey, string> = {
    manageRequests: 'إدارة الطلبات',
    editVehicles: 'تعديل السيارات',
    editDrivers: 'تعديل السائقين',
    manageBindings: 'إدارة الربط',
    editCoding: 'إدارة التكويدات',
    manageUsers: 'إدارة المستخدمين'
  };

  const toggleUserPermission = (username: string, perm: PermissionKey) => {
    setUserPermissions(prev => {
      const currentPerms = prev[username] || [];
      const has = currentPerms.includes(perm);
      const updated = has ? currentPerms.filter(p => p !== perm) : [...currentPerms, perm];
      return { ...prev, [username]: updated };
    });
  };

  const getPermissionForUser = (username: string, perm: PermissionKey): boolean => {
    return (userPermissions[username] || []).includes(perm);
  };

  // --- المزامنة ---
  const syncAllData = async () => {
    setIsSyncing(true);
    try {
      // محاكاة طلب المزامنة مع السيرفر
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastSyncAt(new Date().toISOString());
      addLog('مزامنة', 'تمت المزامنة بنجاح مع السيرفر');
      Alert.alert('نجاح', 'تمت المزامنة بنجاح مع السيرفر الرئيسي');
    } catch (e) {
      Alert.alert('خطأ', 'فشلت المزامنة، تحقق من الاتصال');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- معالجة الطلبات (اعتماد/رفض/تعديل) ---
  const handleApproveOrReject = (reqId: string, newStatus: 'تم الاعتماد' | 'مرفوض') => {
    setRequests(prev =>
      prev.map(r => (r.id === reqId ? { ...r, status: newStatus } : r))
    );
    addLog('تحديث طلب', `تم تغيير حالة الطلب ${reqId} إلى ${newStatus}`);
  };

  const startEditRequest = (req: ServiceRequest) => {
    setEditingRequestId(req.id);
    setReqProcessNo(req.processNumber);
    setReqQuantity(req.quantity);
    setReqPriceAmount(req.priceAmount);
    setReqNotes(req.notes || '');
  };

  const saveEditedRequest = () => {
    if (!editingRequestId) return;
    setRequests(prev =>
      prev.map(r =>
        r.id === editingRequestId
          ? {
              ...r,
              processNumber: reqProcessNo,
              quantity: reqQuantity,
              priceAmount: reqPriceAmount,
              notes: reqNotes
            }
          : r
      )
    );
    addLog('تعديل طلب', `تم تعديل بيانات الطلب ${editingRequestId}`);
    setEditingRequestId(null);
    setReqProcessNo('');
    setReqQuantity('');
    setReqPriceAmount('');
    setReqNotes('');
  };

  // --- حسابات إنشاء طلب خدمة جديد للسائق ---
  const prepareFuelRequest = () => {
    setReqProcessNo(`REQ-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const prepareOilRequest = (vehicleId: string) => {
    setReqProcessNo(`REQ-${Math.floor(1000 + Math.random() * 9000)}`);
    const veh = allVehicles.find(v => v.id === vehicleId);
    const prev = veh?.lastOdometer || 150000;
    setReqPrevOdometer(prev.toString());
    setReqCurrentOdometer(prev.toString());
    setReqDistanceTraveled('0');
  };

  const handleOdometerChange = (val: string) => {
    setReqCurrentOdometer(val);
    const curr = parseFloat(val) || 0;
    const prev = parseFloat(reqPrevOdometer) || 0;
    const diff = curr - prev;
    setReqDistanceTraveled(diff > 0 ? diff.toString() : '0');
  };

  const handleQuantityOrTypeChange = (qty: string, itemType: string) => {
    setReqQuantity(qty);
    const unitPrice = parseFloat(itemPrices[itemType] || '0');
    const qNum = parseFloat(qty) || 0;
    if (unitPrice > 0 && qNum > 0) {
      setReqPriceAmount((unitPrice * qNum).toString());
    }
  };

  const handleCreateRequest = (type: string) => {
    if (!reqQuantity) {
      Alert.alert('تنبيه', 'يرجى إدخال الكمية');
      return;
    }
    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      processNumber: reqProcessNo || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      vehiclePlate: userVehicle.plateNumber,
      driverName: currentUsername,
      type,
      quantity: reqQuantity,
      priceAmount: reqPriceAmount || '0',
      date: new Date().toISOString().split('T')[0],
      status: 'قيد الانتظار',
      notes: reqNotes,
      fuelType: reqFuelType,
      oilType: reqOilType,
      prevOdometer: reqPrevOdometer,
      currentOdometer: reqCurrentOdometer,
      distanceTraveled: reqDistanceTraveled
    };
    setRequests(prev => [newReq, ...prev]);
    addLog('تقديم طلب', `قام السائق ${currentUsername} بتقديم طلب ${type}`);
    Alert.alert('نجاح', 'تم إرسال طلبك بنجاح للترخيص والإدارة');
    setReqQuantity('');
    setReqPriceAmount('');
    setReqNotes('');
  };

  /* ============================================================
     4. واجهة تسجيل الدخول
     ============================================================ */

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.whiteLoginContainer}>
        <View style={styles.whiteLoginCard}>
          <Text style={styles.loginAppTitle}>أطلس 🚚</Text>
          <Text style={styles.loginVersion}>Atlas Fleet Management v2.5</Text>

          <Text style={styles.inputLabel}>اسم المستخدم:</Text>
          <TextInput
            style={styles.whiteInput}
            placeholder="أدخل اسم المستخدم (مثال: methaq)"
            value={loginUsername}
            onChangeText={setLoginUsername}
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>كلمة المرور:</Text>
          <TextInput
            style={styles.whiteInput}
            placeholder="أدخل كلمة المرور"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleLogin}>
            <Text style={styles.whiteSubmitBtnText}>تسجيل الدخول 🔑</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================================================
     5. الواجهة الرئيسية والتنقل (Main Application UI)
     ============================================================ */

  return (
    <SafeAreaView style={styles.container}>
      {/* الشريط العلوي الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>أطلس لإدارة الأسطول</Text>
        <Text style={styles.headerVersion}>
          {currentUsername} ({currentUserRole === 'admin' ? 'مدير' : 'سائق'})
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: '#FFCDD2', fontWeight: 'bold' }}>خروج 🚪</Text>
        </TouchableOpacity>
      </View>

      {/* شريط التبويبات العلوي Navigation Bar */}
      <View style={styles.topBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavScroll}>
          {currentUserRole === 'admin' ? (
            <>
              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_dashboard' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_dashboard')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_dashboard' && styles.activeTopNavText]}>📊 الرئيسة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_requests' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_requests')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_requests' && styles.activeTopNavText]}>📝 الطلبات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_vehicles' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_vehicles')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_vehicles' && styles.activeTopNavText]}>🚗 السيارات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_drivers' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_drivers')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_drivers' && styles.activeTopNavText]}>👤 السائقين</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_bindings' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_bindings')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_bindings' && styles.activeTopNavText]}>🔗 الربط</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_coding' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_coding')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_coding' && styles.activeTopNavText]}>🏷️ التكويدات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_permissions' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_permissions')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_permissions' && styles.activeTopNavText]}>🔐 الصلاحيات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_sync' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_sync')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_sync' && styles.activeTopNavText]}>🔄 المزامنة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_logs' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_logs')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_logs' && styles.activeTopNavText]}>📜 السجل</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'my_requests' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('my_requests')}
              >
                <Text style={[styles.topNavText, currentTab === 'my_requests' && styles.activeTopNavText]}>📋 طلباتي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'request_service' && styles.activeTopNavBtn]}
                onPress={() => {
                  setCurrentTab('request_service');
                  prepareFuelRequest();
                }}
              >
                <Text style={[styles.topNavText, currentTab === 'request_service' && styles.activeTopNavText]}>🛠️ طلب خدمة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'vehicle_info' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('vehicle_info')}
              >
                <Text style={[styles.topNavText, currentTab === 'vehicle_info' && styles.activeTopNavText]}>🚘 سيارتي</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      {/* المحتوى المتبدل حسب التبويب */}
      <ScrollView style={styles.contentContainer}>
        {/* =====================================================
            لوحة التحكم الإدارية (Dashboard)
        ====================================================== */}
        {currentTab === 'admin_dashboard' && currentUserRole === 'admin' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 لوحة المؤشرات العامة</Text>

            <View style={styles.dashboardGrid}>
              <View style={styles.dashboardBox}>
                <Text style={styles.dashboardNumber}>{totalVehicles}</Text>
                <Text style={styles.dashboardLabel}>إجمالي السيارات</Text>
              </View>

              <View style={styles.dashboardBox}>
                <Text style={styles.dashboardNumber}>{totalDrivers}</Text>
                <Text style={styles.dashboardLabel}>إجمالي السائقين</Text>
              </View>

              <View style={styles.dashboardBox}>
                <Text style={styles.dashboardNumber}>{pendingRequestsCount}</Text>
                <Text style={styles.dashboardLabel}>طلبات قيد الانتظار</Text>
              </View>

              <View style={styles.dashboardBox}>
                <Text style={styles.dashboardNumber}>{requests.length}</Text>
                <Text style={styles.dashboardLabel}>إجمالي العمليات</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>إجمالي المصروفات المعتمدة:</Text>
            <Text style={styles.bigAmount}>{totalExpenses.toLocaleString('ar-YE')} ريال</Text>

            <Text style={styles.sectionTitle}>وصول سريع:</Text>
            <TouchableOpacity style={styles.dashboardButton} onPress={() => setCurrentTab('admin_requests')}>
              <Text style={styles.dashboardButtonText}>⬅️ مراجعة الطلبات المنتظرة ({pendingRequestsCount})</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dashboardButton} onPress={() => setCurrentTab('admin_sync')}>
              <Text style={styles.dashboardButtonText}>⬅️ حالة المزامنة والنسخ الاحتياطي</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =====================================================
            إدارة الطلبات (Admin Requests)
        ====================================================== */}
        {currentTab === 'admin_requests' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 إدارة جميع الطلبات والعمليات</Text>

            {requests.map(req =>
              editingRequestId === req.id ? (
                /* نموذج تعديل الطلب */
                <View key={req.id} style={styles.formContainer}>
                  <Text style={styles.sectionTitle}>تعديل الطلب: {req.processNumber}</Text>
                  <Text style={styles.inputLabel}>رقم العملية:</Text>
                  <TextInput style={styles.whiteInput} value={reqProcessNo} onChangeText={setReqProcessNo} />

                  <Text style={styles.inputLabel}>الكمية:</Text>
                  <TextInput style={styles.whiteInput} value={reqQuantity} onChangeText={setReqQuantity} />

                  <Text style={styles.inputLabel}>المبلغ (ريال):</Text>
                  <TextInput style={styles.whiteInput} value={reqPriceAmount} onChangeText={setReqPriceAmount} keyboardType="numeric" />

                  <Text style={styles.inputLabel}>ملاحظات:</Text>
                  <TextInput style={styles.whiteInput} value={reqNotes} onChangeText={setReqNotes} />

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.smallBtn, styles.btnSuccess]} onPress={saveEditedRequest}>
                      <Text style={styles.smallBtnText}>حفظ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallBtn, styles.btnDanger]} onPress={() => setEditingRequestId(null)}>
                      <Text style={styles.smallBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* عرض بطاقة الطلب */
                <View key={req.id} style={styles.requestAdminCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.listItemTitle}>
                      {req.type} - {req.processNumber} ({req.vehiclePlate})
                    </Text>
                    <Text
                      style={[
                        styles.badge,
                        req.status === 'تم الاعتماد'
                          ? styles.badgeSuccess
                          : req.status === 'مرفوض'
                          ? styles.badgeDanger
                          : styles.badgePending
                      ]}
                    >
                      {req.status}
                    </Text>
                  </View>

                  <Text style={styles.cardDetail}>السائق: {req.driverName}</Text>
                  <Text style={styles.cardDetail}>
                    التاريخ: {req.date} | الكمية: {req.quantity} | المبلغ: {req.priceAmount || '0'} ريال
                  </Text>

                  {req.notes ? <Text style={styles.cardDetail}>ملاحظات: {req.notes}</Text> : null}

                  {/* أدوات التحكم وإدارة الطلب */}
                  <View style={styles.actionRow}>
                    {hasPermission('manageRequests') && (
                      <>
                        <TouchableOpacity
                          style={[styles.smallBtn, styles.btnSuccess]}
                          onPress={() => handleApproveOrReject(req.id, 'تم الاعتماد')}
                        >
                          <Text style={styles.smallBtnText}>اعتماد</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.smallBtn, styles.btnDanger]}
                          onPress={() => handleApproveOrReject(req.id, 'مرفوض')}
                        >
                          <Text style={styles.smallBtnText}>رفض</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.smallBtn, styles.btnEdit]}
                          onPress={() => startEditRequest(req)}
                        >
                          <Text style={styles.smallBtnText}>تعديل</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* =====================================================
            قائمة السيارات (Admin Vehicles)
        ====================================================== */}
        {currentTab === 'admin_vehicles' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚗 إدارة السيارات</Text>

            {hasPermission('editVehicles') && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>
                  {editingVehicleId ? 'تعديل بيانات سيارة' : 'إضافة سيارة جديدة'}
                </Text>

                <TextInput
                  style={styles.whiteInput}
                  placeholder="رقم لوحة السيارة"
                  value={vehicleFormPlate}
                  onChangeText={setVehicleFormPlate}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="اسم / وصف السيارة"
                  value={vehicleFormName}
                  onChangeText={setVehicleFormName}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="اسم السائق المرتبط"
                  value={vehicleFormDriver}
                  onChangeText={setVehicleFormDriver}
                  placeholderTextColor="#999"
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.whiteSubmitBtn, { flex: 1, marginHorizontal: 4 }]}
                    onPress={saveVehicle}
                  >
                    <Text style={styles.whiteSubmitBtnText}>حفظ البيانات</Text>
                  </TouchableOpacity>

                  {editingVehicleId && (
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.btnDanger, { flex: 0.5 }]}
                      onPress={cancelVehicleEdit}
                    >
                      <Text style={styles.smallBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <TextInput
              style={styles.whiteInput}
              placeholder="بحث في السيارات (الرقم، الاسم، السائق)..."
              value={vehicleSearch}
              onChangeText={setVehicleSearch}
              placeholderTextColor="#999"
            />

            {filteredVehicles.map(veh => (
              <View key={veh.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{veh.name}</Text>
                  <Text style={styles.cardDetail}>اللوحة: {veh.plateNumber}</Text>
                  <Text style={styles.cardDetail}>السائق: {veh.driverName}</Text>
                </View>

                {hasPermission('editVehicles') && (
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.btnEdit]}
                    onPress={() => startEditVehicle(veh)}
                  >
                    <Text style={styles.smallBtnText}>تعديل</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* =====================================================
            قائمة السائقين (Admin Drivers)
        ====================================================== */}
        {currentTab === 'admin_drivers' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 إدارة السائقين</Text>

            {hasPermission('editDrivers') && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>إضافة سائق جديد</Text>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="اسم السائق الكامل"
                  value={newDriverName}
                  onChangeText={setNewDriverName}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="اسم المستخدم للدخول"
                  value={newDriverUsername}
                  onChangeText={setNewDriverUsername}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={addDriver}>
                  <Text style={styles.whiteSubmitBtnText}>إضافة السائق ➕</Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.whiteInput}
              placeholder="بحث في السائقين..."
              value={driverSearch}
              onChangeText={setDriverSearch}
              placeholderTextColor="#999"
            />

            {filteredDrivers.map(drv => (
              <View key={drv.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{drv.name}</Text>
                  <Text style={styles.cardDetail}>اسم المستخدم: {drv.username}</Text>
                  <Text style={styles.cardDetail}>الحالة: {drv.status}</Text>
                </View>

                {hasPermission('editDrivers') && (
                  <TouchableOpacity
                    style={[
                      styles.smallBtn,
                      drv.status === 'فعال' ? styles.btnDanger : styles.btnSuccess
                    ]}
                    onPress={() => toggleDriverStatus(drv)}
                  >
                    <Text style={styles.smallBtnText}>
                      {drv.status === 'فعال' ? 'توقيف' : 'تفعيل'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* =====================================================
            ربط السائقين بالسيارات (Admin Bindings)
        ====================================================== */}
        {currentTab === 'admin_bindings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔗 ربط السائقين بالسيارات</Text>

            {hasPermission('manageBindings') && (
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>اختر السائق:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {drivers.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.chipBtn,
                        bindingDriverId === d.id && styles.activeChipBtn
                      ]}
                      onPress={() => setBindingDriverId(d.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          bindingDriverId === d.id && styles.activeChipText
                        ]}
                      >
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>اختر السيارة:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {allVehicles.map(v => (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.chipBtn,
                        bindingVehicleId === v.id && styles.activeChipBtn
                      ]}
                      onPress={() => setBindingVehicleId(v.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          bindingVehicleId === v.id && styles.activeChipText
                        ]}
                      >
                        {v.plateNumber} - {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={[styles.whiteInput, { marginTop: 10 }]}
                  placeholder="تاريخ البداية (YYYY-MM-DD)"
                  value={bindingStartDate}
                  onChangeText={setBindingStartDate}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="تاريخ النهاية (YYYY-MM-DD)"
                  value={bindingEndDate}
                  onChangeText={setBindingEndDate}
                  placeholderTextColor="#999"
                />

                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={createBinding}>
                  <Text style={styles.whiteSubmitBtnText}>تأكيد الربط 🔗</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>عمليات الربط الحالية</Text>
            {bindings.map(b => (
              <View key={b.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>
                    {b.driverName} ↔️ {b.vehiclePlate}
                  </Text>
                  <Text style={styles.cardDetail}>
                    من: {b.startDate} إلى: {b.endDate}
                  </Text>
                  <Text style={styles.cardDetail}>الحالة: {b.status}</Text>
                </View>

                {hasPermission('manageBindings') && (
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.btnDanger]}
                    onPress={() => deleteBinding(b.id)}
                  >
                    <Text style={styles.smallBtnText}>حذف</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* =====================================================
            التكويدات والأسعار (Admin Coding)
        ====================================================== */}
        {currentTab === 'admin_coding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏷️ التكويدات والأسعار</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'prices', label: 'الأسعار' },
                { key: 'spareParts', label: 'قطع الغيار' },
                { key: 'oils', label: 'الزيوت' },
                { key: 'allocations', label: 'المخصصات' },
                { key: 'batteries', label: 'البطاريات' },
                { key: 'stations', label: 'المحطات' },
                { key: 'tires', label: 'الإطارات' },
                { key: 'fuelTypes', label: 'أنواع الوقود' }
              ].map(sub => (
                <TouchableOpacity
                  key={sub.key}
                  style={[
                    styles.chipBtn,
                    codingSubTab === sub.key && styles.activeChipBtn
                  ]}
                  onPress={() => setCodingSubTab(sub.key as any)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      codingSubTab === sub.key && styles.activeChipText
                    ]}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {codingSubTab === 'prices' ? (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>تعديل أسعار الأصناف</Text>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="اسم الصنف (مثال: ديزل)"
                  value={priceItemSelect}
                  onChangeText={setPriceItemSelect}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="السعر بالريال"
                  keyboardType="numeric"
                  value={priceValueInput}
                  onChangeText={setPriceValueInput}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleSavePrice}>
                  <Text style={styles.whiteSubmitBtnText}>حفظ السعر 💰</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>جدول الأسعار الحالية</Text>
                {Object.entries(itemPrices).map(([item, price]) => (
                  <View key={item} style={styles.listItem}>
                    <Text style={styles.listItemTitle}>{item}</Text>
                    <Text style={styles.cardDetail}>{price} ريال</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="إضافة عنصر جديد للتكويد"
                  value={newCodeInput}
                  onChangeText={setNewCodeInput}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={addNewCode}>
                  <Text style={styles.whiteSubmitBtnText}>إضافة التكويد ➕</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>العناصر المكوّدة</Text>
                {codes[codingSubTab as keyof CodeCategories]?.map(item => (
                  <View key={item} style={styles.listItem}>
                    <Text style={styles.listItemTitle}>{item}</Text>
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.btnDanger]}
                      onPress={() => deleteCode(codingSubTab as keyof CodeCategories, item)}
                    >
                      <Text style={styles.smallBtnText}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* =====================================================
            صلاحيات المستخدمين (Admin Permissions)
        ====================================================== */}
        {currentTab === 'admin_permissions' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔐 إدارة صلاحيات المستخدمين</Text>

            {drivers.map(drv => (
              <View key={drv.id} style={styles.userPermCard}>
                <Text style={styles.sectionTitle}>
                  المستخدم: {drv.name} ({drv.username})
                </Text>

                <View style={styles.permGrid}>
                  {allPermissions.map(p => {
                    const hasPerm = getPermissionForUser(drv.username, p);
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.permChip,
                          hasPerm && styles.permChipActive
                        ]}
                        onPress={() => toggleUserPermission(drv.username, p)}
                      >
                        <Text
                          style={[
                            styles.permChipText,
                            hasPerm && styles.permChipTextActive
                          ]}
                        >
                          {permissionNames[p]} {hasPerm ? '✓' : '✗'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* =====================================================
            المزامنة (Admin Sync)
        ====================================================== */}
        {currentTab === 'admin_sync' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔄 المزامنة والنسخ الاحتياطي</Text>

            <Text style={styles.cardDetail}>رابط السيرفر: {SYNC_API_URL}</Text>
            <Text style={styles.cardDetail}>
              آخر مزامنة: {lastSyncAt ? new Date(lastSyncAt).toLocaleString('ar-YE') : 'لم تتم المزامنة بعد'}
            </Text>

            <TouchableOpacity
              style={[styles.whiteSubmitBtn, { marginTop: 20 }]}
              onPress={syncAllData}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color="#0D47A1" />
              ) : (
                <Text style={styles.whiteSubmitBtnText}>بدء المزامنة الآن 🔄</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* =====================================================
            سجل العمليات (Admin Logs / Audit Trail)
        ====================================================== */}
        {currentTab === 'admin_logs' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 سجل عمليات النظام</Text>

            {auditLogs.map(log => (
              <View key={log.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{log.action}</Text>
                  <Text style={styles.cardDetail}>{log.details}</Text>
                  <Text style={styles.cardDetail}>
                    بواسطة: {log.username} | {new Date(log.date).toLocaleString('ar-YE')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* =====================================================
            شاشات السائق (My Requests / Request Service / Vehicle Info)
        ====================================================== */}
        {currentTab === 'my_requests' && currentUserRole === 'user' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 طلباتي المسجلة</Text>
            {requests
              .filter(r => r.vehiclePlate === userVehicle.plateNumber)
              .map(req => (
                <View key={req.id} style={styles.requestAdminCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.listItemTitle}>
                      {req.type} - {req.processNumber}
                    </Text>
                    <Text
                      style={[
                        styles.badge,
                        req.status === 'تم الاعتماد'
                          ? styles.badgeSuccess
                          : req.status === 'مرفوض'
                          ? styles.badgeDanger
                          : styles.badgePending
                      ]}
                    >
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.cardDetail}>التاريخ: {req.date}</Text>
                  <Text style={styles.cardDetail}>الكمية: {req.quantity}</Text>
                  <Text style={styles.cardDetail}>
                    الإجمالي: {req.priceAmount || '0'} ريال
                  </Text>
                </View>
              ))}
          </View>
        )}

        {currentTab === 'request_service' && currentUserRole === 'user' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛠️ تقديم طلب خدمة جديد</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chipBtn,
                    serviceSubTab === t && styles.activeChipBtn
                  ]}
                  onPress={() => {
                    setServiceSubTab(t);
                    if (t === 'زيوت') prepareOilRequest(userVehicle.id);
                    if (t === 'وقود') prepareFuelRequest();
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      serviceSubTab === t && styles.activeChipText
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>رقم العملية:</Text>
              <TextInput style={styles.whiteInput} value={reqProcessNo} editable={false} />

              <Text style={styles.inputLabel}>الكمية / العدد:</Text>
              <TextInput
                style={styles.whiteInput}
                keyboardType="numeric"
                value={reqQuantity}
                onChangeText={q => handleQuantityOrTypeChange(q, reqFuelType || reqOilType)}
                placeholder="أدخل الكمية"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>المبلغ الإجمالي المقدر:</Text>
              <TextInput
                style={styles.whiteInput}
                keyboardType="numeric"
                value={reqPriceAmount}
                onChangeText={setReqPriceAmount}
                placeholder="المبلغ بالريال"
                placeholderTextColor="#999"
              />

              {serviceSubTab === 'وقود' && (
                <>
                  <Text style={styles.inputLabel}>نوع الوقود:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {codes.fuelTypes.map(ft => (
                      <TouchableOpacity
                        key={ft}
                        style={[
                          styles.chipBtn,
                          reqFuelType === ft && styles.activeChipBtn
                        ]}
                        onPress={() => setReqFuelType(ft)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            reqFuelType === ft && styles.activeChipText
                          ]}
                        >
                          {ft}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {serviceSubTab === 'زيوت' && (
                <>
                  <Text style={styles.inputLabel}>قراءة العداد السابقة:</Text>
                  <TextInput
                    style={styles.whiteInput}
                    value={reqPrevOdometer}
                    editable={false}
                  />

                  <Text style={styles.inputLabel}>قراءة العداد الحالية:</Text>
                  <TextInput
                    style={styles.whiteInput}
                    keyboardType="numeric"
                    value={reqCurrentOdometer}
                    onChangeText={handleOdometerChange}
                    placeholder="أدخل القراءة الحالية"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.inputLabel}>المسافة المقطوعة (كم):</Text>
                  <TextInput
                    style={styles.whiteInput}
                    value={reqDistanceTraveled}
                    editable={false}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>ملاحظات إضافية:</Text>
              <TextInput
                style={styles.whiteInput}
                value={reqNotes}
                onChangeText={setReqNotes}
                placeholder="أي ملاحظات..."
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.whiteSubmitBtn}
                onPress={() => handleCreateRequest(serviceSubTab)}
              >
                <Text style={styles.whiteSubmitBtnText}>إرسال الطلب 📤</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'vehicle_info' && currentUserRole === 'user' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚘 تفاصيل السيارة الحالية</Text>
            <Text style={styles.listItemTitle}>{userVehicle.name}</Text>
            <Text style={styles.cardDetail}>رقم اللوحة: {userVehicle.plateNumber}</Text>
            <Text style={styles.cardDetail}>السائق: {userVehicle.driverName}</Text>
            <Text style={styles.cardDetail}>الحالة: {userVehicle.status}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   6. التنسيقات الأنيقة والشاملة (Styles)
   ============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  whiteLoginContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  whiteLoginCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  loginAppTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'center',
    marginBottom: 4
  },
  loginVersion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'right'
  },
  whiteInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    marginBottom: 12
  },
  whiteSubmitBtn: {
    backgroundColor: '#0D47A1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  },
  whiteSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  header: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  headerVersion: {
    color: '#BBDEFB',
    fontSize: 12
  },
  topBarContainer: {
    backgroundColor: '#1565C0',
    paddingVertical: 6
  },
  topNavScroll: {
    paddingHorizontal: 8,
    flexDirection: 'row-reverse'
  },
  topNavBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  activeTopNavBtn: {
    backgroundColor: '#FFFFFF'
  },
  topNavText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  activeTopNavText: {
    color: '#0D47A1',
    fontWeight: 'bold'
  },
  contentContainer: {
    flex: 1,
    padding: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 16,
    textAlign: 'right'
  },
  dashboardGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  dashboardBox: {
    width: '48%',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  dashboardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D47A1'
  },
  dashboardLabel: {
    fontSize: 13,
    color: '#424242',
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'right'
  },
  bigAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'right'
  },
  dashboardButton: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  dashboardButtonText: {
    color: '#1565C0',
    fontWeight: 'bold',
    textAlign: 'right'
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
    marginVertical: 4
  },
  activeChipBtn: {
    backgroundColor: '#0D47A1'
  },
  chipText: {
    color: '#666',
    fontSize: 13
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  requestAdminCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FAFAFA'
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'right'
  },
  cardDetail: {
    fontSize: 13,
    color: '#616161',
    marginBottom: 2,
    textAlign: 'right'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 'bold',
    overflow: 'hidden'
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32'
  },
  badgeDanger: {
    backgroundColor: '#FFEBEE',
    color: '#C62828'
  },
  badgePending: {
    backgroundColor: '#FFF8E1',
    color: '#F57F17'
  },
  actionRow: {
    flexDirection: 'row-reverse',
    marginTop: 8
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6
  },
  btnSuccess: {
    backgroundColor: '#2E7D32'
  },
  btnDanger: {
    backgroundColor: '#C62828'
  },
  btnEdit: {
    backgroundColor: '#0288D1'
  },
  smallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  formContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  listItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE'
  },
  userPermCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  permGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: 6
  },
  permChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    margin: 3
  },
  permChipActive: {
    backgroundColor: '#E8F5E9'
  },
  permChipText: {
    fontSize: 11,
    color: '#C62828'
  },
  permChipTextActive: {
    color: '#2E7D32',
    fontWeight: 'bold'
  }
});

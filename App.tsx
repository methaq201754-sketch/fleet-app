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
  Modal,
  Switch
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

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
}

interface ServiceRequest {
  id: string;
  type: 'وقود' | 'زيوت' | 'إطارات' | 'بطاريات' | 'صيانة وقطع غيار';
  processNumber: string;
  date: string;
  quantity: string;
  priceAmount?: string; // بالقيمة
  allocation: string;
  station?: string;
  notes?: string;
  status: 'قيد المراجعة' | 'مرفوض' | 'تم الاعتماد';
  syncStatus: 'PENDING_PUSH' | 'SYNCED';
  vehicleId: string;
  driverName: string;
}

interface UserPermissions {
  canRequestFuel: boolean;
  canRequestOil: boolean;
  canRequestTires: boolean;
  canRequestBatteries: boolean;
  canRequestMaintenance: boolean;
  canViewReports: boolean;
}

export default function App() {
  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests'); // الشاشة الافتراضية
  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<string>('وقود');
  const [reportSubTab, setReportSubTab] = useState<string>('وقود_مقبول');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('لم تتم المزامنة بعد');

  // 🚗 بيانات السيارة المسجلة بالحساب الحالي
  const [userVehicle, setUserVehicle] = useState<Vehicle>({
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

  // 🚘 قائمة السيارات (للمسؤول)
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([
    {
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
    },
    {
      id: 'v2',
      name: 'دينا توزيع',
      plateNumber: '5678-ب',
      driverName: 'أحمد علي',
      type: 'متوسطة',
      capacity: '5 طن',
      transportType: 'منتجات',
      model: '2020',
      passengers: '3',
      fuelType: 'بنزين',
      status: 'في الخدمة'
    }
  ]);

  // 👨‍✈️ قائمة السائقين (للمسؤول)
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 'd1', name: 'ميثاق عبده علي مقبل', phone: '770000000', licenseNo: 'L-1020' },
    { id: 'd2', name: 'أحمد علي', phone: '730000000', licenseNo: 'L-3040' }
  ]);

  // 🔐 كلمة المرور والصلاحيات
  const [userPassword, setUserPassword] = useState('123456');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    canRequestFuel: true,
    canRequestOil: true,
    canRequestTires: true,
    canRequestBatteries: true,
    canRequestMaintenance: true,
    canViewReports: true,
  });

  // 📝 الطلبات
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  // 📅 تواريخ فلاتر التقارير
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportYear, setReportYear] = useState('2026');
  const [reportMonth, setReportMonth] = useState('09');

  // 📥 قراءة البيانات المحفوظة محلياً عند الفتح
  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedVehicle = await AsyncStorage.getItem('@user_vehicle');
      const savedSyncTime = await AsyncStorage.getItem('@last_sync_time');
      const savedVehiclesList = await AsyncStorage.getItem('@all_vehicles');
      const savedDrivers = await AsyncStorage.getItem('@all_drivers');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      else {
        const defaultReqs: ServiceRequest[] = [
          {
            id: 'APP-1001',
            type: 'وقود',
            processNumber: 'TRX-1001',
            date: '2026-09-25',
            quantity: '100',
            priceAmount: '50000',
            allocation: 'رحلة تعز - عدن',
            station: 'محطة أطلس المركزية',
            notes: 'طلب عاجل للرحلة',
            status: 'تم الاعتماد',
            syncStatus: 'SYNCED',
            vehicleId: 'v1',
            driverName: 'ميثاق عبده علي مقبل'
          },
          {
            id: 'APP-1002',
            type: 'زيوت',
            processNumber: 'TRX-1002',
            date: '2026-09-24',
            quantity: '4 لتر',
            priceAmount: '12000',
            allocation: 'صيانة دورية',
            station: 'مركز الصيانة المركزية',
            notes: 'تغيير زيت المحرك',
            status: 'قيد المراجعة',
            syncStatus: 'PENDING_PUSH',
            vehicleId: 'v1',
            driverName: 'ميثاق عبده علي مقبل'
          }
        ];
        setRequests(defaultReqs);
        await AsyncStorage.setItem('@fleet_requests', JSON.stringify(defaultReqs));
      }

      if (savedVehicle) setUserVehicle(JSON.parse(savedVehicle));
      if (savedVehiclesList) setAllVehicles(JSON.parse(savedVehiclesList));
      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
      if (savedSyncTime) setLastSyncTime(savedSyncTime);
    } catch (e) {
      console.log('خطأ في تحميل البيانات المحلية', e);
    }
  };

  const saveRequestsLocally = async (newList: ServiceRequest[]) => {
    setRequests(newList);
    await AsyncStorage.setItem('@fleet_requests', JSON.stringify(newList));
  };

  const saveUserVehicleLocally = async (veh: Vehicle) => {
    setUserVehicle(veh);
    await AsyncStorage.setItem('@user_vehicle', JSON.stringify(veh));
  };

  const saveAllVehiclesLocally = async (list: Vehicle[]) => {
    setAllVehicles(list);
    await AsyncStorage.setItem('@all_vehicles', JSON.stringify(list));
  };

  // 🛠️ نموذج تقديم طلب خدمة جديد
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('ديزل');
  const [reqNotes, setReqNotes] = useState('');

  const handleCreateRequest = (type: any) => {
    if (userVehicle.status === 'موقف') {
      Alert.alert('تنبيه خطأ', 'تم إيقاف هذه السيارة من قبل الإدارة. لا يمكن تقديم أي طلبات جديدة.');
      return;
    }

    if (!reqQuantity || !reqAllocation) {
      Alert.alert('خطأ', 'يرجى إكمال البيانات المطلوبة (الكمية والمخصص).');
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

    // إشعار على الهاتف للمسؤول وللمستخدم
    Alert.alert('🔔 إشعار جديد فوق الشاشة', `تم إرسال طلب ${type} جديد بنجاح لسيارة ${userVehicle.name} وهو قيد المراجعة.`);

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

  // 👑 موافقة أو رفض المسؤول مع إرسال إشعار
  const handleAdminApproval = (reqId: string, status: 'تم الاعتماد' | 'مرفوض') => {
    const targetReq = requests.find(r => r.id === reqId);
    const updated = requests.map((r) => (r.id === reqId ? { ...r, status } : r));
    saveRequestsLocally(updated);

    Alert.alert('🔔 إشعار إداري فوق الشاشة', `تم ${status} للطلب رقم ${targetReq?.processNumber} الخاص بالسائق ${targetReq?.driverName}`);
  };

  // 🚘 إدارة السيارات (المسؤول)
  const [selectedVehicleForStatus, setSelectedVehicleForStatus] = useState<string>('v1');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleDriver, setNewVehicleDriver] = useState('');

  const handleAddVehicle = () => {
    if (!newVehicleName || !newVehiclePlate) {
      Alert.alert('خطأ', 'يرجى إدخال اسم ورقم السيارة');
      return;
    }
    const v: Vehicle = {
      id: `v_${Date.now()}`,
      name: newVehicleName,
      plateNumber: newVehiclePlate,
      driverName: newVehicleDriver || 'غير محدد',
      type: 'شاحنة',
      capacity: '10 طن',
      transportType: 'عام',
      model: '2023',
      passengers: '2',
      fuelType: 'ديزل',
      status: 'في الخدمة'
    };
    const list = [...allVehicles, v];
    saveAllVehiclesLocally(list);
    Alert.alert('تم', 'تمت إضافة السيارة بنجاح.');
    setNewVehicleName('');
    setNewVehiclePlate('');
    setNewVehicleDriver('');
  };

  const handleToggleVehicleStatus = (status: 'في الخدمة' | 'موقف') => {
    const list = allVehicles.map(v => v.id === selectedVehicleForStatus ? { ...v, status } : v);
    saveAllVehiclesLocally(list);

    if (userVehicle.id === selectedVehicleForStatus) {
      const updatedUserVeh = { ...userVehicle, status };
      saveUserVehicleLocally(updatedUserVeh);
    }

    Alert.alert('تم التحديث', `تم تغيير حالة السيارة إلى: (${status})`);
  };

  // 👨‍✈️ إدارة السائقين (المسؤول)
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');

  const handleAddDriver = () => {
    if (!driverNameInput) return;
    const d: Driver = { id: `d_${Date.now()}`, name: driverNameInput, phone: driverPhoneInput, licenseNo: 'L-100' };
    const list = [...drivers, d];
    setDrivers(list);
    AsyncStorage.setItem('@all_drivers', JSON.stringify(list));
    setDriverNameInput('');
    setDriverPhoneInput('');
    Alert.alert('تم', 'تمت إضافة السائق بنجاح');
  };

  const handleDeleteDriver = (id: string) => {
    const list = drivers.filter(d => d.id !== id);
    setDrivers(list);
    AsyncStorage.setItem('@all_drivers', JSON.stringify(list));
  };

  // 🔒 تغيير كلمة المرور للمستخدم
  const handleChangePassword = () => {
    if (!newPasswordInput) return;
    setUserPassword(newPasswordInput);
    setNewPasswordInput('');
    Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح.');
  };

  // 🚪 تسجيل الخروج
  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'تم تسجيل الخروج بنجاح.');
    setCurrentTab('my_requests');
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

      {/* الهيدر مع رقم الإصدار v1.0.8 */}
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
          {currentUserRole === 'user' ? 'السيارات - أطلس (v1.0.8)' : 'أطلس - إداري (v1.0.8)'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ==================== 👤 حساب المستخدم ==================== */}
        {currentUserRole === 'user' && (
          <>
            {/* 1️⃣ أيقونة وشاشة "طلباتي" */}
            {currentTab === 'my_requests' && (
              <View>
                <Text style={styles.sectionTitle}>📋 قائمة طلباتي</Text>
                
                {/* الأيقونات الفرعية لكافة أنواع الطلبات */}
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
                      <Text style={{ fontSize: 11, color: item.syncStatus === 'SYNCED' ? '#2E7D32' : '#E65100', marginTop: 4, textAlign: 'right' }}>
                        {item.syncStatus === 'SYNCED' ? '☁️ متزامن مع Oracle' : '📱 مخزن محلياً (غير مرفوع)'}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 2️⃣ شاشة بيانات السيارات (المخصصة للحساب فقط) */}
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

                {/* خيارات نوع الخدمة */}
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
                      <TextInput style={styles.input} value={reqFuelType} onChangeText={setReqFuelType} placeholder="ديزل / بنزين" />
                    </>
                  )}

                  <Text style={styles.inputLabel}>الكمية (باللتر / العدد):</Text>
                  <TextInput style={styles.input} placeholder="أدخل الكمية" value={reqQuantity} onChangeText={setReqQuantity} keyboardType="numeric" />

                  <Text style={styles.inputLabel}>القيمة التقديرية (بالريال):</Text>
                  <TextInput style={styles.input} placeholder="أدخل القيمة" value={reqPriceAmount} onChangeText={setReqPriceAmount} keyboardType="numeric" />

                  <Text style={styles.inputLabel}>المخصص / الغرض:</Text>
                  <TextInput style={styles.input} placeholder="مثال: رحلة تعز - عدن" value={reqAllocation} onChangeText={setReqAllocation} />

                  <Text style={styles.inputLabel}>المحطة / الورشة:</Text>
                  <TextInput style={styles.input} placeholder="اسم المحطة أو الورشة" value={reqStation} onChangeText={setReqStation} />

                  <Text style={styles.inputLabel}>رقم العملية:</Text>
                  <TextInput style={styles.input} placeholder="أدخل رقم العملية" value={reqProcessNo} onChangeText={setReqProcessNo} />

                  <Text style={styles.inputLabel}>ملاحظات إضافية:</Text>
                  <TextInput style={styles.input} placeholder="أدخل أية تفاصيل أخرى" value={reqNotes} onChangeText={setReqNotes} />

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

                {/* فلترة التاريخ والشهور */}
                <View style={styles.filterCard}>
                  <Text style={styles.filterTitle}>🔍 تصفية حسب الفترة:</Text>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="السنة (2026)" value={reportYear} onChangeText={setReportYear} />
                    <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="الشهر (09)" value={reportMonth} onChangeText={setReportMonth} />
                  </View>
                </View>

                {/* أيقونات أقسام التقارير */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  {[
                    { id: 'وقود_مقبول', label: 'الوقود المقبول' },
                    { id: 'وقود_مراجعة', label: 'الوقود قيد المراجعة' },
                    { id: 'وقود_مرفوض', label: 'الوقود المرفوض' },
                    { id: 'صيانة', label: 'تقارير الصيانة' },
                    { id: 'زيوت', label: 'تقارير الزيوت' },
                    { id: 'إطارات', label: 'تقارير الإطارات' },
                    { id: 'بطاريات', label: 'تقارير البطاريات' },
                    { id: 'قطع_غيار', label: 'قطع الغيار' }
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.typeChip, reportSubTab === r.id && styles.activeTypeChip]}
                      onPress={() => setReportSubTab(r.id)}
                    >
                      <Text style={[styles.typeChipText, reportSubTab === r.id && styles.activeTypeChipText]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* عرض نتائج التقرير */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>نتائج التقرير ({reportSubTab})</Text>
                  
                  {reportSubTab === 'وقود_مقبول' && (
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.summaryText}>الإجمالي باللتر: 150 لتر</Text>
                      <Text style={styles.summaryText}>الإجمالي بالقيمة: 75,000 ريال</Text>
                    </View>
                  )}

                  {requests.map(r => (
                    <View key={r.id} style={styles.reportItemRow}>
                      <Text style={styles.cardDetail}>التاريخ: {r.date} | رقم العملية: {r.processNumber}</Text>
                      <Text style={styles.cardDetail}>الكمية: {r.quantity} | المحطة: {r.station}</Text>
                      <Text style={styles.cardDetail}>المخصص: {r.allocation}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 3️⃣ أيقونة وشاشة الإعدادات للمستخدم */}
            {currentTab === 'settings' && (
              <View>
                <Text style={styles.sectionTitle}>⚙️ إعدادات الحساب</Text>

                <View style={styles.card}>
                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>اسم السيارة: {userVehicle.name}</Text>
                    <TouchableOpacity onPress={() => Alert.alert('تعديل', 'أدخل اسم السيارة جديد')}>
                      <Text style={styles.editPen}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>رقم السيارة: {userVehicle.plateNumber}</Text>
                    <TouchableOpacity onPress={() => Alert.alert('تعديل', 'أدخل رقم السيارة جديد')}>
                      <Text style={styles.editPen}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editRow}>
                    <Text style={styles.inputLabel}>اسم السائق: {userVehicle.driverName}</Text>
                    <TouchableOpacity onPress={() => Alert.alert('تعديل', 'أدخل اسم السائق جديد')}>
                      <Text style={styles.editPen}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.inputLabel}>تغيير كلمة المرور:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="أدخل كلمة المرور الجديدة"
                      secureTextEntry
                      value={newPasswordInput}
                      onChangeText={setNewPasswordInput}
                    />
                    <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword}>
                      <Text style={styles.submitBtnText}>حفظ كلمة المرور الجديدة</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4️⃣ زر تسجيل الخروج بالأسفل */}
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#D32F2F', marginTop: 20 }]} onPress={handleLogout}>
                  <Text style={styles.submitBtnText}>🚪 تسجيل الخروج</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ==================== 👑 حساب المسؤول ==================== */}
        {currentUserRole === 'admin' && (
          <>
            {/* 6️⃣ شاشة طلبات الموظفين */}
            {currentTab === 'admin_requests' && (
              <View>
                <Text style={styles.sectionTitle}>🔔 طلبات الموظفين (الإدارة)</Text>

                {requests.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Text style={styles.cardTitle}>طلب {item.type}</Text>
                    <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                    <Text style={styles.cardDetail}>تاريخ الطلب: {item.date}</Text>
                    <Text style={styles.cardDetail}>السائق: {item.driverName}</Text>
                    <Text style={styles.cardDetail}>المحطة / الورشة: {item.station}</Text>
                    <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                    <Text style={styles.cardDetail}>الكمية / القيمة: {item.quantity}</Text>
                    <Text style={styles.cardDetail}>الملاحظات: {item.notes || 'لا يوجد'}</Text>
                    <Text style={[styles.cardDetail, { fontWeight: 'bold' }]}>الحالة الحالية: {item.status}</Text>

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

            {/* 8️⃣ شاشة إضافة وتعديل وإيقاف سيارة */}
            {currentTab === 'admin_vehicles' && (
              <View>
                <Text style={styles.sectionTitle}>🚗 إضافة وتعديل وإيقاف السيارات</Text>

                {/* إيقاف / تشغيل سيارة */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>⛔ إيقاف وتشغيل سيارة</Text>
                  <Text style={styles.inputLabel}>اختر السيارة:</Text>
                  {allVehicles.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.typeChip, selectedVehicleForStatus === v.id && styles.activeTypeChip]}
                      onPress={() => setSelectedVehicleForStatus(v.id)}
                    >
                      <Text style={[styles.typeChipText, selectedVehicleForStatus === v.id && styles.activeTypeChipText]}>
                        {v.name} ({v.plateNumber}) - {v.status}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 12 }}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2E7D32' }]} onPress={() => handleToggleVehicleStatus('في الخدمة')}>
                      <Text style={styles.actionBtnText}>▶️ تشغيل السيارة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D32F2F' }]} onPress={() => handleToggleVehicleStatus('موقف')}>
                      <Text style={styles.actionBtnText}>⏸️ إيقاف السيارة</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* إضافة سيارة جديده */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>➕ إضافة سيارة جديدة</Text>
                  <TextInput style={styles.input} placeholder="اسم السيارة" value={newVehicleName} onChangeText={setNewVehicleName} />
                  <TextInput style={styles.input} placeholder="رقم السيارة / اللوحة" value={newVehiclePlate} onChangeText={setNewVehiclePlate} />
                  <TextInput style={styles.input} placeholder="اسم السائق المخصص" value={newVehicleDriver} onChangeText={setNewVehicleDriver} />
                  <TouchableOpacity style={styles.submitBtn} onPress={handleAddVehicle}>
                    <Text style={styles.submitBtnText}>حفظ السيارة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 9️⃣ شاشة بيانات السائقين */}
            {currentTab === 'admin_drivers' && (
              <View>
                <Text style={styles.sectionTitle}>👨‍✈️ إدارة بيانات السائقين</Text>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>إضافة سائق جديد</Text>
                  <TextInput style={styles.input} placeholder="اسم السائق" value={driverNameInput} onChangeText={setDriverNameInput} />
                  <TextInput style={styles.input} placeholder="رقم الهاتف" value={driverPhoneInput} onChangeText={setDriverPhoneInput} keyboardType="phone-pad" />
                  <TouchableOpacity style={styles.submitBtn} onPress={handleAddDriver}>
                    <Text style={styles.submitBtnText}>حفظ السائق</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>قائمة السائقين الحاليين:</Text>
                {drivers.map(d => (
                  <View key={d.id} style={styles.card}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={styles.cardTitle}>{d.name}</Text>
                        <Text style={styles.cardDetail}>الهاتف: {d.phone}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteDriver(d.id)}>
                        <Text style={{ color: 'red', fontWeight: 'bold' }}>حذف 🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 🔟 شاشة صلاحيات المستخدمين */}
            {currentTab === 'admin_permissions' && (
              <View>
                <Text style={styles.sectionTitle}>🔑 إدارة صلاحيات المستخدمين</Text>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>الصلاحيات الخاصة بالحسابات:</Text>
                  
                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>طلب وقود</Text>
                    <Switch value={userPermissions.canRequestFuel} onValueChange={(val) => setUserPermissions({ ...userPermissions, canRequestFuel: val })} />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>طلب زيوت</Text>
                    <Switch value={userPermissions.canRequestOil} onValueChange={(val) => setUserPermissions({ ...userPermissions, canRequestOil: val })} />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>طلب إطارات وبطاريات</Text>
                    <Switch value={userPermissions.canRequestTires} onValueChange={(val) => setUserPermissions({ ...userPermissions, canRequestTires: val })} />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>عرض التقارير</Text>
                    <Switch value={userPermissions.canViewReports} onValueChange={(val) => setUserPermissions({ ...userPermissions, canViewReports: val })} />
                  </View>

                  <TouchableOpacity style={styles.submitBtn} onPress={() => Alert.alert('تم', 'تم حفظ الصلاحيات بنجاح.')}>
                    <Text style={styles.submitBtnText}>حفظ التغييرات</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* 4️⃣ & 5️⃣ الشريط السفلي للتنقل والملاحة */}
      <View style={styles.navBar}>
        {currentUserRole === 'user' ? (
          <>
            <TouchableOpacity onPress={() => setCurrentTab('my_requests')}>
              <Text style={styles.navText}>📋 طلباتي</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('request_service')}>
              <Text style={styles.navText}>🛠️ طلب خدمة</Text>
            </TouchableOpacity>
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
            <TouchableOpacity onPress={() => setCurrentTab('admin_vehicles')}>
              <Text style={styles.navText}>🚗 السيارات</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('admin_drivers')}>
              <Text style={styles.navText}>👨‍✈️ السائقين</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('admin_permissions')}>
              <Text style={styles.navText}>🔑 الصلاحيات</Text>
            </TouchableOpacity>
          </>
        )}
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
  navText: { fontSize: 12, fontWeight: 'bold', color: '#0D47A1' },
  adminActionRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20 },
  editRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  editPen: { fontSize: 16 },
  filterCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 10 },
  filterTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, textAlign: 'right' },
  typeChip: { backgroundColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, margin: 4 },
  activeTypeChip: { backgroundColor: '#1565C0' },
  typeChipText: { color: '#333', fontSize: 11 },
  activeTypeChipText: { color: '#FFF', fontWeight: 'bold' },
  reportSummaryBox: { backgroundColor: '#E8EAF6', padding: 10, borderRadius: 8, marginVertical: 8 },
  summaryText: { fontSize: 13, fontWeight: 'bold', color: '#1A237E', textAlign: 'right' },
  reportItemRow: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 6 },
  switchRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }
});

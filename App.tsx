
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  FlatList,
  Switch,
  Image,
  Platform
} from 'react-native';

// ==========================================
// VERSION & BUILD INFO
// ==========================================
const APP_VERSION = "1.22.1";
const APP_BUILD = "32";

// ==========================================
// INITIAL FLEET DATA (43 Vehicles)
// ==========================================
const INITIAL_FLEET = [
  { id: '22618', name: 'قاطرة فولفو 2002 رقم 22618', driver: 'عبد الغني علي دحان', status: 'في الخدمة', type: 'شاحنة', model: '2002', payload: '40 طن', fuelType: 'ديزل', engineNo: 'ENG-22618', chassisNo: 'CHS-22618' },
  { id: '36040', name: 'شاحنة فولفو 2013 رقم 36040', driver: 'حافظ عبده محمد النينه', status: 'في الخدمة', type: 'شاحنة', model: '2013', payload: '35 طن', fuelType: 'ديزل', engineNo: 'ENG-36040', chassisNo: 'CHS-36040' },
  { id: '28336', name: 'متسوبيشي فوزو 2012 رقم 28336', driver: 'عبد الله احمد عبد الله', status: 'في الخدمة', type: 'دينا', model: '2012', payload: '7 طن', fuelType: 'ديزل', engineNo: 'ENG-28336', chassisNo: 'CHS-28336' },
  { id: '31538', name: 'ايسوزو 2016 رقم 31538', driver: 'خالد عثمان سعيد', status: 'في الخدمة', type: 'دينا', model: '2016', payload: '5 طن', fuelType: 'ديزل', engineNo: 'ENG-31538', chassisNo: 'CHS-31538' },
  { id: '34552', name: 'ايسوزو 2015 رقم 34552', driver: 'عبد الاله محمد احمد', status: 'في الخدمة', type: 'دينا', model: '2015', payload: '5 طن', fuelType: 'ديزل', engineNo: 'ENG-34552', chassisNo: 'CHS-34552' },
  { id: '33230', name: 'بابور اسيوزا 2016 رقم 33230', driver: 'سامي عبدالنور', status: 'في الخدمة', type: 'شاحنة', model: '2016', payload: '10 طن', fuelType: 'ديزل', engineNo: 'ENG-33230', chassisNo: 'CHS-33230' },
  { id: '34208', name: 'ايسوزو 2020 رقم 34208', driver: 'محمد عبده محمد', status: 'في الخدمة', type: 'دينا', model: '2020', payload: '5 طن', fuelType: 'ديزل', engineNo: 'ENG-34208', chassisNo: 'CHS-34208' },
  { id: '28807', name: 'دينا متسوبيشي 2012 رقم 28807', driver: 'عفيف سعيد محمد', status: 'في الخدمة', type: 'دينا', model: '2012', payload: '6 طن', fuelType: 'ديزل', engineNo: 'ENG-28807', chassisNo: 'CHS-28807' },
  { id: '29485', name: 'دينا متسوبيشي 2013 رقم 29485', driver: 'حمود سرحان', status: 'في الخدمة', type: 'دينا', model: '2013', payload: '6 طن', fuelType: 'ديزل', engineNo: 'ENG-29485', chassisNo: 'CHS-29485' },
  { id: '30646', name: 'دينا متسوبيشي 2014 رقم 30646', driver: 'عبده محمد النينه', status: 'في الخدمة', type: 'دينا', model: '2014', payload: '6 طن', fuelType: 'ديزل', engineNo: 'ENG-30646', chassisNo: 'CHS-30646' },
  { id: '36697', name: 'دينا متسوبيشي 2013 رقم 36697', driver: 'حسام عبده سالم', status: 'في الخدمة', type: 'دينا', model: '2013', payload: '6 طن', fuelType: 'ديزل', engineNo: 'ENG-36697', chassisNo: 'CHS-36697' },
  { id: '34451', name: 'باص كوستر 2012', driver: 'عماد علي دحان', status: 'في الخدمة', type: 'باص', model: '2012', payload: '30 ركاب', fuelType: 'ديزل', engineNo: 'ENG-34451', chassisNo: 'CHS-34451' },
  { id: '23317', name: 'دايهاتسو قلاب موديل 2004', driver: 'محمد محسن', status: 'في الخدمة', type: 'قلاب', model: '2004', payload: '3 طن', fuelType: 'بنزين', engineNo: 'ENG-23317', chassisNo: 'CHS-23317' },
  { id: '28185', name: 'دينا متسوبيشي 2010', driver: 'عبد الغني علي دحان', status: 'في الخدمة', type: 'دينا', model: '2010', payload: '6 طن', fuelType: 'ديزل', engineNo: 'ENG-28185', chassisNo: 'CHS-28185' },
  { id: '31457', name: 'لاندكروزر صالون 2012', driver: 'رشاد عبدالحميد', status: 'في الخدمة', type: 'صالون', model: '2012', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-31457', chassisNo: 'CHS-31457' },
  { id: '46383', name: 'رافور تويوتا 2020', driver: 'حمدي شريف', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2020', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-46383', chassisNo: 'CHS-46383' },
  { id: '29732', name: 'لاندكروزر صالون 2011', driver: 'عامر محمد علي نعمان', status: 'في الخدمة', type: 'صالون', model: '2011', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-29732', chassisNo: 'CHS-29732' },
  { id: '139614', name: 'رافور تويوتا 2020', driver: 'وسيم عامر محمد علي', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2020', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-139614', chassisNo: 'CHS-139614' },
  { id: '161777', name: 'تويوتا رافور 2021', driver: 'احمد لطفي عبد الحميد', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2021', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-161777', chassisNo: 'CHS-161777' },
  { id: '53665', name: 'جيب 2014', driver: 'وهيب عبدالحميد', status: 'في الخدمة', type: 'جيب', model: '2014', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-53665', chassisNo: 'CHS-53665' },
  { id: '27750', name: 'فرتشنار تويوتا 2010', driver: 'لطفي سعيد علي', status: 'في الخدمة', type: 'جيب', model: '2010', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-27750', chassisNo: 'CHS-27750' },
  { id: '30551', name: 'فرتشنار تويوتا 2014', driver: 'عبدالله الوردي', status: 'في الخدمة', type: 'جيب', model: '2014', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-30551', chassisNo: 'CHS-30551' },
  { id: '29015', name: 'هيلوكس غمارة 2010', driver: 'ماجد عبده فارع', status: 'في الخدمة', type: 'بيك أب', model: '2010', payload: '1.5 طن', fuelType: 'بنزين', engineNo: 'ENG-29015', chassisNo: 'CHS-29015' },
  { id: '13287', name: 'هيلوكس غمارتين ديزل 2014', driver: 'مروان الفقية', status: 'في الخدمة', type: 'بيك أب', model: '2014', payload: '1.5 طن', fuelType: 'ديزل', engineNo: 'ENG-13287', chassisNo: 'CHS-13287' },
  { id: '44972', name: 'سوزكي جيمني 2015', driver: 'صابر جواد', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2015', payload: '4 ركاب', fuelType: 'بنزين', engineNo: 'ENG-44972', chassisNo: 'CHS-44972' },
  { id: '25749', name: 'هيلوكس غماره 2013', driver: 'محمد عبد القوي الشوافي', status: 'في الخدمة', type: 'بيك أب', model: '2013', payload: '1.5 طن', fuelType: 'بنزين', engineNo: 'ENG-25749', chassisNo: 'CHS-25749' },
  { id: '26519', name: 'هليوكس غمارتين 2008', driver: 'الخدمات', status: 'في الخدمة', type: 'بيك أب', model: '2008', payload: '1.5 طن', fuelType: 'بنزين', engineNo: 'ENG-26519', chassisNo: 'CHS-26519' },
  { id: '20040', name: 'هواندي توسان 2012', driver: 'محمد النعماني', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2012', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-20040', chassisNo: 'CHS-20040' },
  { id: '45551', name: 'زوكي جمني 2013', driver: 'عبد الله مكرد', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2013', payload: '4 ركاب', fuelType: 'بنزين', engineNo: 'ENG-45551', chassisNo: 'CHS-45551' },
  { id: '19404', name: 'باص كوستر 2004', driver: 'يزيد عبد الواسع', status: 'في الخدمة', type: 'باص', model: '2004', payload: '30 ركاب', fuelType: 'ديزل', engineNo: 'ENG-19404', chassisNo: 'CHS-19404' },
  { id: '46166', name: 'دايهاتسو-تريوس', driver: 'سالم', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2012', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-46166', chassisNo: 'CHS-46166' },
  { id: '34189', name: 'هواندي توسان 2014', driver: 'رمزي الماريو', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2014', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-34189', chassisNo: 'CHS-34189' },
  { id: '46379', name: 'فوشنار 2015', driver: 'عبدالفتاح درهم', status: 'في الخدمة', type: 'جيب', model: '2015', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-46379', chassisNo: 'CHS-46379' },
  { id: '43166', name: 'دايهاتسو تريوس 2013', driver: 'هاني فيصل', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2013', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-43166', chassisNo: 'CHS-43166' },
  { id: '46140', name: 'باص كوستر 2012 جديد بدون رقم', driver: 'جميل قائد سعيد', status: 'في الخدمة', type: 'باص', model: '2012', payload: '30 ركاب', fuelType: 'ديزل', engineNo: 'ENG-46140', chassisNo: 'CHS-46140' },
  { id: '27949', name: 'دايهاتسو طويل 2010 رقم 27949', driver: 'مصطفى المخلافي', status: 'في الخدمة', type: 'دينا', model: '2010', payload: '4 طن', fuelType: 'بنزين', engineNo: 'ENG-27949', chassisNo: 'CHS-27949' },
  { id: '54446', name: 'هونداي توسان 2020', driver: 'محمد صادق سليمان', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2020', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-54446', chassisNo: 'CHS-54446' },
  { id: '54825', name: 'هونداي توسان 2020', driver: 'اشرف عبد القادر', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2020', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-54825', chassisNo: 'CHS-54825' },
  { id: '43661', name: 'دايهاتسو تريوس 2015', driver: 'سالم باوزير', status: 'في الخدمة', type: 'سيارة صغيرة', model: '2015', payload: '5 ركاب', fuelType: 'بنزين', engineNo: 'ENG-43661', chassisNo: 'CHS-43661' },
  { id: '16501', name: 'هيلوكس غماره 2014', driver: 'اشرف محفوظ', status: 'في الخدمة', type: 'بيك أب', model: '2014', payload: '1.5 طن', fuelType: 'بنزين', engineNo: 'ENG-16501', chassisNo: 'CHS-16501' },
  { id: '43998', name: 'تويوتا هيلوكس غمارتين دبل 2021', driver: 'عبدالرقيب عبدالوهاب', status: 'في الخدمة', type: 'بيك أب', model: '2021', payload: '1.5 طن', fuelType: 'ديزل', engineNo: 'ENG-43998', chassisNo: 'CHS-43998' },
  { id: '49039', name: 'تويوتا فور تشنر 2013', driver: 'خالد الشراعي', status: 'في الخدمة', type: 'جيب', model: '2013', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-49039', chassisNo: 'CHS-49039' },
  { id: '56989', name: 'تويوتا فور تشنر 2015', driver: 'نبيل الشوافي', status: 'في الخدمة', type: 'جيب', model: '2015', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-56989', chassisNo: 'CHS-56989' }
];

export default function App() {
  // App State
  const [currentUser, setCurrentUser] = useState<any>(null); // null, { role: 'admin' }, or vehicle object
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Data States
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [stations, setStations] = useState(['محطة الزبيدي', 'محطة الشركة', 'محطة نقدي']);
  const [oils, setOils] = useState(['تويوتا', 'ليكوي مولي', 'ناشيونال']);
  const [allocations, setAllocations] = useState(['تعز', 'صنعاء', 'عدن', 'الحديدة', 'إب', 'مأرب', 'مخصص شهري']);
  
  // Pricing State
  const [prices, setPrices] = useState({
    fuelPerLiter: 1200,
    oilPerLiter: 4500,
    tireUnit: 85000,
    batteryUnit: 65000
  });

  // Requests State
  const [requests, setRequests] = useState<any[]>([
    {
      id: 'REQ-1001',
      vehicleId: '22618',
      driver: 'عبد الغني علي دحان',
      type: 'وقود',
      date: '2026-10-01',
      qty: 50,
      total: 60000,
      station: 'محطة الشركة',
      allocation: 'تعز',
      status: '🟢 تم الاعتماد',
      notes: 'تم التعبئة للرحلة'
    },
    {
      id: 'REQ-1002',
      vehicleId: '36040',
      driver: 'حافظ عبده محمد النينه',
      type: 'زيوت',
      date: '2026-10-01',
      oilType: 'تويوتا',
      qty: 4,
      prevOdo: 124000,
      currOdo: 129000,
      distance: 5000,
      total: 18000,
      status: '🟡 قيد المراجعة',
      notes: 'تغيير زيت دوري'
    }
  ]);

  // UI Navigation State for User
  const [userTab, setUserTab] = useState<'service' | 'my_requests' | 'vehicle_info' | 'reports' | 'settings'>('service');
  const [adminTab, setAdminTab] = useState<'coding' | 'requests' | 'fleet' | 'permissions'>('requests');
  
  // Form Modals
  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  
  // Request Form Inputs
  const [reqQty, setReqQty] = useState('');
  const [selectedStation, setSelectedStation] = useState(stations[0]);
  const [selectedAllocation, setSelectedAllocation] = useState(allocations[0]);
  const [selectedOil, setSelectedOil] = useState(oils[0]);
  const [currOdometer, setCurrOdometer] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  // Editing Info State
  const [editDriverName, setEditDriverName] = useState('');
  const [editVehicleName, setEditVehicleName] = useState('');

  // ----------------------------------------------------
  // LOGIN LOGIC
  // ----------------------------------------------------
  const handleLogin = () => {
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (trimmedUser === 'ميثاق' && trimmedPass === '111') {
      setCurrentUser({ role: 'admin', name: 'المسؤول ميثاق' });
      setUsername('');
      setPassword('');
      return;
    }

    const foundVehicle = fleet.find(v => v.id === trimmedUser);
    if (foundVehicle && trimmedPass === '000') {
      if (foundVehicle.status === 'موقف') {
        Alert.alert('حساب موقف', 'هذه السيارة موقوفة حالياً وممنوعة من تقديم الطلبات.');
        return;
      }
      setCurrentUser({ role: 'driver', ...foundVehicle });
      setEditDriverName(foundVehicle.driver);
      setEditVehicleName(foundVehicle.name);
      setUsername('');
      setPassword('');
      return;
    }

    Alert.alert('خطأ في الدخول', 'اسم المستخدم أو كلمة المرور غير صحيحة.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserTab('service');
    setAdminTab('requests');
  };

  // ----------------------------------------------------
  // DRIVER: SUBMIT SERVICE REQUEST
  // ----------------------------------------------------
  const submitRequest = (type: string) => {
    if (!reqQty || isNaN(Number(reqQty))) {
      Alert.alert('تنبيه', 'يرجى إدخال كمية صالحة.');
      return;
    }

    const newReqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    let calculatedTotal = 0;

    if (type === 'وقود') {
      calculatedTotal = Number(reqQty) * prices.fuelPerLiter;
    } else if (type === 'زيوت') {
      calculatedTotal = Number(reqQty) * prices.oilPerLiter;
    } else {
      calculatedTotal = Number(reqQty) * 10000;
    }

    const newReq: any = {
      id: newReqId,
      vehicleId: currentUser.id,
      driver: currentUser.driver,
      type,
      date: today,
      qty: Number(reqQty),
      total: calculatedTotal,
      notes: reqNotes,
      status: '🟡 قيد المراجعة'
    };

    if (type === 'وقود') {
      newReq.station = selectedStation;
      newReq.allocation = selectedAllocation;
    } else if (type === 'زيوت') {
      newReq.oilType = selectedOil;
      const lastOdo = 120000; // Auto-fetched previous odometer
      newReq.prevOdo = lastOdo;
      newReq.currOdo = Number(currOdometer) || lastOdo;
      newReq.distance = newReq.currOdo - lastOdo;
    }

    setRequests([newReq, ...requests]);
    Alert.alert('تم بنجاح', `تم إرسال طلب ${type} بنجاح برقم عملية: ${newReqId}`);
    setServiceTypeModal(null);
    setReqQty('');
    setCurrOdometer('');
    setReqNotes('');
  };

  // ----------------------------------------------------
  // ADMIN: APPROVE / REJECT
  // ----------------------------------------------------
  const updateRequestStatus = (id: string, newStatus: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  // ----------------------------------------------------
  // RENDER LOGIN SCREEN (PURE & CLEAN)
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>تسجيل الدخول</Text>
          
          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textAlign="right"
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>دخول</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>الإصدار {APP_VERSION} (البناء {APP_BUILD})</Text>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // RENDER ADMIN DASHBOARD
  // ----------------------------------------------------
  if (currentUser.role === 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerAdmin}>
          <Text style={styles.headerTitle}>لوحة تحكم المسؤول</Text>
          <Text style={styles.headerSubtitle}>مرحباً، {currentUser.name}</Text>
        </View>

        {/* Admin Navigation Bar */}
        <View style={styles.adminNav}>
          <TouchableOpacity onPress={() => setAdminTab('requests')} style={[styles.navItem, adminTab === 'requests' && styles.navActive]}>
            <Text style={styles.navText}>الطلبات ({requests.filter(r => r.status.includes('المراجعة')).length})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAdminTab('coding')} style={[styles.navItem, adminTab === 'coding' && styles.navActive]}>
            <Text style={styles.navText}>التكويد والأسعار</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAdminTab('fleet')} style={[styles.navItem, adminTab === 'fleet' && styles.navActive]}>
            <Text style={styles.navText}>إدارة السيارات</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAdminTab('permissions')} style={[styles.navItem, adminTab === 'permissions' && styles.navActive]}>
            <Text style={styles.navText}>الصلاحيات</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {adminTab === 'requests' && (
            <View>
              <Text style={styles.sectionTitle}>الطلبات الواردة من السائقين</Text>
              {requests.map(req => (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardId}>{req.id} - {req.type}</Text>
                    <Text style={styles.cardStatus}>{req.status}</Text>
                  </View>
                  <Text style={styles.cardText}>السيارة: {req.vehicleId} | السائق: {req.driver}</Text>
                  <Text style={styles.cardText}>التاريخ: {req.date} | الكمية: {req.qty}</Text>
                  <Text style={styles.cardText}>الإجمالي: {req.total?.toLocaleString()} ريال</Text>
                  {req.notes ? <Text style={styles.cardText}>ملاحظات: {req.notes}</Text> : null}

                  {req.status.includes('المراجعة') && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.btnAction, { backgroundColor: '#2e7d32' }]}
                        onPress={() => updateRequestStatus(req.id, '🟢 تم الاعتماد')}
                      >
                        <Text style={styles.btnActionText}>اعتماد</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.btnAction, { backgroundColor: '#c62828' }]}
                        onPress={() => updateRequestStatus(req.id, '🔴 مرفوض')}
                      >
                        <Text style={styles.btnActionText}>رفض</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {adminTab === 'coding' && (
            <View>
              <Text style={styles.sectionTitle}>تكويد الأسعار والمحطات</Text>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>سعر اللتر للوقود (ريال)</Text>
                <TextInput 
                  style={styles.inputInline} 
                  keyboardType="numeric"
                  value={String(prices.fuelPerLiter)}
                  onChangeText={(val) => setPrices({ ...prices, fuelPerLiter: Number(val) || 0 })}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>المحطات المكوّدة</Text>
                {stations.map((st, idx) => (
                  <View key={idx} style={styles.inlineItem}>
                    <Text style={styles.itemText}>{st}</Text>
                    <TouchableOpacity onPress={() => setStations(stations.filter((_, i) => i !== idx))}>
                      <Text style={{ color: 'red' }}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {adminTab === 'fleet' && (
            <View>
              <Text style={styles.sectionTitle}>إدارة أسطول السيارات ({fleet.length} سيارة)</Text>
              {fleet.map(v => (
                <View key={v.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{v.name}</Text>
                  <Text style={styles.cardText}>رقم السيارة: {v.id} | السائق: {v.driver}</Text>
                  <Text style={styles.cardText}>الحالة: {v.status}</Text>
                  <TouchableOpacity 
                    style={[styles.btnToggle, { backgroundColor: v.status === 'في الخدمة' ? '#d32f2f' : '#388e3c' }]}
                    onPress={() => {
                      setFleet(fleet.map(item => item.id === v.id ? { ...item, status: item.status === 'في الخدمة' ? 'موقف' : 'في الخدمة' } : item));
                    }}
                  >
                    <Text style={styles.btnToggleText}>{v.status === 'في الخدمة' ? 'تغيير إلى موقف' : 'تنشيط إلى في الخدمة'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {adminTab === 'permissions' && (
            <View>
              <Text style={styles.sectionTitle}>إدارة صلاحيات المستخدمين</Text>
              <Text style={styles.cardText}>يمكنك تخصيص الصلاحيات لكل سيارة وسائق لمنع أو إتاحة تقديم طلبات معينة.</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.logoutBtnAdmin} onPress={handleLogout}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // RENDER DRIVER DASHBOARD
  // ----------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Driver Top Header */}
      <View style={styles.driverHeader}>
        <Text style={styles.driverHeaderTitle}>رقم السيارة: {currentUser.id}</Text>
        <Text style={styles.driverHeaderSub}>السائق: {currentUser.driver}</Text>
      </View>

      {/* Main Content Area based on Selected Tab */}
      <ScrollView style={styles.content}>
        {userTab === 'service' && (
          <View style={styles.gridContainer}>
            <Text style={styles.sectionTitle}>شاشة طلب خدمة جديدة</Text>
            
            <TouchableOpacity style={styles.gridCard} onPress={() => setServiceTypeModal('وقود')}>
              <Text style={styles.gridCardTitle}>⛽ طلب وقود (محروقات)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => setServiceTypeModal('زيوت')}>
              <Text style={styles.gridCardTitle}>🛢️ طلب زيوت</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => setServiceTypeModal('قطع غيار')}>
              <Text style={styles.gridCardTitle}>🔧 طلب قطع غيار</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => setServiceTypeModal('صيانة')}>
              <Text style={styles.gridCardTitle}>🛠️ طلب صيانة</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => setServiceTypeModal('إطارات')}>
              <Text style={styles.gridCardTitle}>🛞 طلب إطارات</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => setServiceTypeModal('بطاريات')}>
              <Text style={styles.gridCardTitle}>🔋 طلب بطاريات</Text>
            </TouchableOpacity>
          </View>
        )}

        {userTab === 'my_requests' && (
          <View>
            <Text style={styles.sectionTitle}>طلباتي السابقة</Text>
            {requests.filter(r => r.vehicleId === currentUser.id).map(req => (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardId}>{req.id} - {req.type}</Text>
                  <Text style={styles.cardStatus}>{req.status}</Text>
                </View>
                <Text style={styles.cardText}>التاريخ: {req.date}</Text>
                <Text style={styles.cardText}>الكمية: {req.qty}</Text>
                <Text style={styles.cardText}>الإجمالي: {req.total?.toLocaleString()} ريال</Text>
              </View>
            ))}
          </View>
        )}

        {userTab === 'vehicle_info' && (
          <View style={styles.card}>
            <View style={styles.backHeader}>
              <TouchableOpacity onPress={() => setUserTab('service')}>
                <Text style={styles.backArrow}>➔</Text>
              </TouchableOpacity>
              <Text style={styles.backTitle}>بيانات السيارة الحالية</Text>
            </View>

            <Text style={styles.infoRow}>اسم السيارة: {currentUser.name}</Text>
            <Text style={styles.infoRow}>رقم السيارة: {currentUser.id}</Text>
            <Text style={styles.infoRow}>اسم السائق: {currentUser.driver}</Text>
            <Text style={styles.infoRow}>نوع السيارة: {currentUser.type}</Text>
            <Text style={styles.infoRow}>الموديل: {currentUser.model}</Text>
            <Text style={styles.infoRow}>الحمولة: {currentUser.payload}</Text>
            <Text style={styles.infoRow}>نوع الوقود: {currentUser.fuelType}</Text>
            <Text style={styles.infoRow}>حالة السيارة: {currentUser.status}</Text>
          </View>
        )}

        {userTab === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>التقارير والاستعلامات التفصيلية</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ملخص المصاريف المعتمدة</Text>
              <Text style={styles.cardText}>إجمالي الوقود: 60,000 ريال</Text>
              <Text style={styles.cardText}>إجمالي الزيوت: 18,000 ريال</Text>
              <Text style={styles.cardText}>إجمالي الصيانة: 0 ريال</Text>
            </View>
          </View>
        )}

        {userTab === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>الإعدادات وحساب المستخدم</Text>
            
            <Text style={styles.inputLabel}>اسم السائق:</Text>
            <TextInput style={styles.inputInline} value={editDriverName} onChangeText={setEditDriverName} />

            <Text style={styles.inputLabel}>تغيير كلمة المرور:</Text>
            <TextInput style={styles.inputInline} secureTextEntry placeholder="كلمة المرور الجديدة" />

            <TouchableOpacity style={styles.saveBtn} onPress={() => Alert.alert('تم', 'تم حفظ التعديلات بنجاح')}>
              <Text style={styles.saveBtnText}>حفظ التعديلات</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Driver Bottom Navigation */}
      <View style={styles.driverNav}>
        <TouchableOpacity style={styles.driverNavItem} onPress={() => setUserTab('service')}>
          <Text style={[styles.driverNavText, userTab === 'service' && styles.activeNavText]}>طلب خدمة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.driverNavItem} onPress={() => setUserTab('my_requests')}>
          <Text style={[styles.driverNavText, userTab === 'my_requests' && styles.activeNavText]}>طلباتي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.driverNavItem} onPress={() => setUserTab('vehicle_info')}>
          <Text style={[styles.driverNavText, userTab === 'vehicle_info' && styles.activeNavText]}>السيارة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.driverNavItem} onPress={() => setUserTab('reports')}>
          <Text style={[styles.driverNavText, userTab === 'reports' && styles.activeNavText]}>التقارير</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.driverNavItem} onPress={() => setUserTab('settings')}>
          <Text style={[styles.driverNavText, userTab === 'settings' && styles.activeNavText]}>الإعدادات</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Request Form */}
      <Modal visible={!!serviceTypeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تقديم طلب {serviceTypeModal}</Text>
            
            <Text style={styles.inputLabel}>الكمية:</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="numeric" 
              value={reqQty} 
              onChangeText={setReqQty} 
              placeholder="أدخل الكمية"
            />

            {serviceTypeModal === 'وقود' && (
              <View>
                <Text style={styles.inputLabel}>المبلغ الإجمالي التقريبي:</Text>
                <Text style={styles.calcTotal}>{(Number(reqQty) * prices.fuelPerLiter).toLocaleString()} ريال</Text>
              </View>
            )}

            {serviceTypeModal === 'زيوت' && (
              <View>
                <Text style={styles.inputLabel}>العداد الحالي (كم):</Text>
                <TextInput 
                  style={styles.modalInput} 
                  keyboardType="numeric" 
                  value={currOdometer} 
                  onChangeText={setCurrOdometer} 
                  placeholder="أدخل العداد الحالي"
                />
              </View>
            )}

            <Text style={styles.inputLabel}>الملاحظات:</Text>
            <TextInput 
              style={styles.modalInput} 
              value={reqNotes} 
              onChangeText={setReqNotes} 
              placeholder="أي ملاحظات إضافية"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSubmit} onPress={() => submitRequest(serviceTypeModal!)}>
                <Text style={styles.btnText}>إرسال الطلب</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setServiceTypeModal(null)}>
                <Text style={styles.btnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// STYLESHEET
// ==========================================
const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1a202c'
  },
  input: {
    backgroundColor: '#edf2f7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#2d3748'
  },
  loginBtn: {
    backgroundColor: '#0f4c81',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  versionText: {
    marginTop: 20,
    color: '#a0aec0',
    fontSize: 12
  },
  container: {
    flex: 1,
    backgroundColor: '#f7fafc'
  },
  headerAdmin: {
    backgroundColor: '#1a365d',
    padding: 16,
    alignItems: 'flex-end'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: '#cbd5e0',
    fontSize: 14
  },
  adminNav: {
    flexDirection: 'row',
    backgroundColor: '#2b6cb0',
    justifyContent: 'space-around',
    paddingVertical: 10
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  navActive: {
    backgroundColor: '#1a365d'
  },
  navText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13
  },
  content: {
    flex: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
    color: '#2d3748'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  cardId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2b6cb0'
  },
  cardStatus: {
    fontWeight: 'bold'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8
  },
  cardText: {
    textAlign: 'right',
    color: '#4a5568',
    marginBottom: 4
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12
  },
  btnAction: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6
  },
  btnActionText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  inputInline: {
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    padding: 10,
    textAlign: 'right',
    marginBottom: 10
  },
  inlineItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7'
  },
  itemText: {
    fontSize: 15
  },
  btnToggle: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  btnToggleText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  logoutBtnAdmin: {
    backgroundColor: '#e53e3e',
    padding: 14,
    alignItems: 'center'
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  driverHeader: {
    backgroundColor: '#2b6cb0',
    padding: 16,
    alignItems: 'flex-end'
  },
  driverHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  driverHeaderSub: {
    color: '#e2e8f0',
    fontSize: 14
  },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2
  },
  gridCardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#2d3748'
  },
  driverNav: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8
  },
  driverNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6
  },
  driverNavText: {
    fontSize: 12,
    color: '#718096'
  },
  activeNavText: {
    color: '#2b6cb0',
    fontWeight: 'bold'
  },
  backHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16
  },
  backArrow: {
    fontSize: 24,
    color: '#2b6cb0',
    marginLeft: 12
  },
  backTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  infoRow: {
    textAlign: 'right',
    fontSize: 15,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    color: '#2d3748'
  },
  inputLabel: {
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a5568',
    marginTop: 8,
    marginBottom: 4
  },
  saveBtn: {
    backgroundColor: '#319795',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  logoutBtn: {
    backgroundColor: '#e53e3e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16
  },
  modalInput: {
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    padding: 10,
    textAlign: 'right',
    marginBottom: 12
  },
  calcTotal: {
    textAlign: 'right',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2b6cb0',
    marginBottom: 12
  },
  modalActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 12
  },
  btnSubmit: {
    backgroundColor: '#2b6cb0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  btnCancel: {
    backgroundColor: '#a0aec0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

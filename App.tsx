
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  Switch,
  Image,
  Dimensions
} from 'react-native';

// ==========================================
// VERSION & BUILD INFO
// ==========================================
const APP_VERSION = '1.22.1';
const APP_BUILD = '32';

// ==========================================
// INITIAL FLEET & SYSTEM DATA
// ==========================================
const INITIAL_FLEET = [
  { id: '22618', name: 'قاطرة فولفو 2002 رقم 22618', driver: 'عبد الغني علي دحان', type: 'قاطرة', model: '2002', status: 'في الخدمة', capacity: '40 طن', fuelType: 'ديزل', passengers: 2, transportType: 'ثقيل' },
  { id: '36040', name: 'شاحنة فولفو 2013 رقم 36040', driver: 'حافظ عبده محمد النينه', type: 'شاحنة', model: '2013', status: 'في الخدمة', capacity: '30 طن', fuelType: 'ديزل', passengers: 2, transportType: 'ثقيل' },
  { id: '28336', name: 'متسوبيشي فوزو 2012 رقم 28336', driver: 'عبد الله احمد عبد الله', type: 'شاحنة متوسطة', model: '2012', status: 'في الخدمة', capacity: '10 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '31538', name: 'ايسوزو 2016 رقم 31538', driver: 'خالد عثمان سعيد', type: 'دينا', model: '2016', status: 'في الخدمة', capacity: '5 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '34552', name: 'ايسوزو 2015 رقم 34552', driver: 'عبد الاله محمد احمد', type: 'دينا', model: '2015', status: 'في الخدمة', capacity: '5 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '33230', name: 'بابور اسيوزا 2016 رقم 33230', driver: 'سامي عبدالنور', type: 'دينا', model: '2016', status: 'في الخدمة', capacity: '5 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '34208', name: 'ايسوزو 2020 رقم 34208', driver: 'محمد عبده محمد', type: 'دينا', model: '2020', status: 'في الخدمة', capacity: '5 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '28807', name: 'دينا متسوبيشي 2012 رقم 28807', driver: 'عفيف سعيد محمد', type: 'دينا', model: '2012', status: 'في الخدمة', capacity: '4 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '29485', name: 'دينا متسوبيشي 2013 رقم 29485', driver: 'حمود سرحان', type: 'دينا', model: '2013', status: 'في الخدمة', capacity: '4 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '30646', name: 'دينا متسوبيشي 2014 رقم 30646', driver: 'عبده محمد النينه', type: 'دينا', model: '2014', status: 'في الخدمة', capacity: '4 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '36697', name: 'دينا متسوبيشي 2013 رقم 36697', driver: 'حسام عبده سالم', type: 'دينا', model: '2013', status: 'في الخدمة', capacity: '4 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '34451', name: 'باص كوستر 2012', driver: 'عماد علي دحان', type: 'باص', model: '2012', status: 'في الخدمة', capacity: '3 طن', fuelType: 'ديزل', passengers: 30, transportType: 'ركاب' },
  { id: '23317', name: 'دايهاتسو قلاب موديل 2004', driver: 'محمد محسن', type: 'قلاب', model: '2004', status: 'في الخدمة', capacity: '3 طن', fuelType: 'بترول', passengers: 2, transportType: 'مواد بناء' },
  { id: '28185', name: 'دينا متسوبيشي 2010', driver: 'عبد الغني علي دحان', type: 'دينا', model: '2010', status: 'في الخدمة', capacity: '4 طن', fuelType: 'ديزل', passengers: 3, transportType: 'بضائع' },
  { id: '31457', name: 'لاندكروزر صالون 2012', driver: 'رشاد عبدالحميد', type: 'صالون', model: '2012', status: 'في الخدمة', capacity: '1 طن', fuelType: 'بترول', passengers: 7, transportType: 'شخصي/ركاب' },
  { id: '46383', name: 'رافور تويوتا 2020', driver: 'حمدي شريف', type: 'جيب', model: '2020', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '29732', name: 'لاندكروزر صالون 2011', driver: 'عامر محمد علي نعمان', type: 'صالون', model: '2011', status: 'في الخدمة', capacity: '1 طن', fuelType: 'بترول', passengers: 7, transportType: 'شخصي/ركاب' },
  { id: '139614', name: 'رافور تويوتا 2020', driver: 'وسيم عامر محمد علي', type: 'جيب', model: '2020', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '161777', name: 'تويوتا رافور 2021', driver: 'احمد لطفي عبد الحميد', type: 'جيب', model: '2021', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '53665', name: 'جيب 2014', driver: 'وهيب عبدالحميد', type: 'جيب', model: '2014', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '27750', name: 'فرتشنار تويوتا 2010', driver: 'لطفي سعيد علي', type: 'جيب', model: '2010', status: 'في الخدمة', capacity: '0.7 طن', fuelType: 'بترول', passengers: 7, transportType: 'شخصي' },
  { id: '30551', name: 'فرتشنار تويوتا 2014', driver: 'عبدالله الوردي', type: 'جيب', model: '2014', status: 'في الخدمة', capacity: '0.7 طن', fuelType: 'بترول', passengers: 7, transportType: 'شخصي' },
  { id: '29015', name: 'هيلوكس غمارة 2010', driver: 'ماجد عبده فارع', type: 'بيك أب', model: '2010', status: 'في الخدمة', capacity: '1.5 طن', fuelType: 'بترول', passengers: 3, transportType: 'نقل خفيف' },
  { id: '13287', name: 'هيلوكس غمارتين ديزل 2014', driver: 'مروان الفقية', type: 'بيك أب', model: '2014', status: 'في الخدمة', capacity: '1.5 طن', fuelType: 'ديزل', passengers: 6, transportType: 'نقل خفيف' },
  { id: '44972', name: 'سوزكي جيمني 2015', driver: 'صابر جواد', type: 'جيب صغير', model: '2015', status: 'في الخدمة', capacity: '0.3 طن', fuelType: 'بترول', passengers: 4, transportType: 'شخصي' },
  { id: '25749', name: 'هيلوكس غماره 2013', driver: 'محمد عبد القوي الشوافي', type: 'بيك أب', model: '2013', status: 'في الخدمة', capacity: '1.5 طن', fuelType: 'بترول', passengers: 3, transportType: 'نقل خفيف' },
  { id: '26519', name: 'هليوكس غمارتين 2008', driver: 'الخدمات', type: 'بيك أب', model: '2008', status: 'في الخدمة', capacity: '1.5 طن', fuelType: 'بترول', passengers: 6, transportType: 'خدمي' },
  { id: '20040', name: 'هواندي توسان 2012', driver: 'محمد النعماني', type: 'جيب', model: '2012', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '45551', name: 'زوكي جمني 2013', driver: 'عبد الله مكرد', type: 'جيب صغير', model: '2013', status: 'في الخدمة', capacity: '0.3 طن', fuelType: 'بترول', passengers: 4, transportType: 'شخصي' },
  { id: '19404', name: 'باص كوستر 2004', driver: 'يزيد عبد الواسع', type: 'باص', model: '2004', status: 'في الخدمة', capacity: '3 طن', fuelType: 'ديزل', passengers: 30, transportType: 'ركاب' },
  { id: '46166', name: 'دايهاتسو-تريوس', driver: 'سالم', type: 'جيب صغير', model: '2011', status: 'في الخدمة', capacity: '0.4 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '34189', name: 'هواندي توسان 2014', driver: 'رمزي الماريو', type: 'جيب', model: '2014', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '46379', name: 'فوشنار 2015', driver: 'عبدالفتاح درهم', type: 'جيب', model: '2015', status: 'في الخدمة', capacity: '0.7 طن', fuelType: 'بترول', passengers: 7, transportType: 'شخصي' },
  { id: '43166', name: 'دايهاتسو تريوس 2013', driver: 'هاني فيصل', type: 'جيب صغير', model: '2013', status: 'في الخدمة', capacity: '0.4 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '46140', name: 'باص كوستر 2012 جديد بدون رقم', driver: 'جميل قائد سعيد', type: 'باص', model: '2012', status: 'في الخدمة', capacity: '3 طن', fuelType: 'ديزل', passengers: 30, transportType: 'ركاب' },
  { id: '27949', name: 'دايهاتسو طويل 2010 رقم 27949', driver: 'مصطفى المخلافي', type: 'بيك أب', model: '2010', status: 'في الخدمة', capacity: '1.5 طن', fuelType: 'بترول', passengers: 3, transportType: 'نقل خفيف' },
  { id: '54446', name: 'هونداي توسان 2020', driver: 'محمد صادق سليمان', type: 'جيب', model: '2020', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '54825', name: 'هونداي توسان 2020', driver: 'اشرف عبد القادر', type: 'جيب', model: '2020', status: 'في الخدمة', capacity: '0.5 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '43661', name: 'دايهاتسو تريوس 2015', driver: 'سالم باوزير', type: 'جيب صغير', model: '2015', status: 'في الخدمة', capacity: '0.4 طن', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' },
  { id: '16501', name: 'هيلوكس غماره 2014', driver: 'اشرف محفوظ', type: 'بيك أب', model: '2014', status: 'في الخدمة', capacity: '1.5 طن', fuelType: 'بترول', passengers: 3, transportType: 'نقل خفيف' },
  { id: '43998', name: 'تويوتا هيلوكس غمارتين دبل 2021', driver: 'عبدالرقيب عبدالوهاب', type: 'بيك أب', model: '2021', status: 'في الخدمة', capacity: '1.5 طن', fuelType: 'ديزل', passengers: 6, transportType: 'نقل خفيف' },
  { id: '49039', name: 'تويوتا فور تشنر 2013', driver: 'خالد الشراعي', type: 'جيب', model: '2013', status: 'في الخدمة', capacity: '0.7 طن', fuelType: 'بترول', passengers: 7, transportType: 'شخصي' },
  { id: '56989', name: 'تويوتا فور تشنر 2015', driver: 'نبيل الشوافي', type: 'جيب', model: '2015', status: 'في الخدمة', capacity: '0.7 طن', fuelType: 'بترول', passengers: 7, transportType: 'شخصي' },
];

export default function App() {
  // App state & Auth
  const [user, setUser] = useState<any>(null); // null = Login screen
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({ 'ميثاق': '111' });

  // Navigation tab state (User or Admin)
  const [activeTab, setActiveTab] = useState('request'); // 'request', 'myRequests', 'carData', 'reports', 'settings'
  const [adminTab, setAdminTab] = useState('codings'); // 'codings', 'requests', 'fleet', 'drivers', 'linkage', 'permissions'

  // Master Data
  const [fleetData, setFleetData] = useState(INITIAL_FLEET);
  const [stations, setStations] = useState(['محطة الزبيدي', 'محطة الشركة', 'محطة نقدي']);
  const [oils, setOils] = useState(['تويوتا', 'ليكي مولي', 'ناشيونال']);
  const [allocations, setAllocations] = useState(['أمانة العاصمة', 'عدن', 'تعز', 'الحديدة', 'إب', 'مخصص شهري']);
  const [sparePartsList, setSparePartsList] = useState(['فلاتر زيت', 'فحمات فرامل', 'سير محرك', 'بواجي']);
  const [maintenanceReasons, setMaintenanceReasons] = useState(['صيانة دورية', 'إصلاح فرامل', 'تغيير مباخر', 'كهرباء']);
  const [batteriesList, setBatteriesList] = useState(['بطارية 70 أمبير', 'بطارية 100 أمبير']);
  const [tiresList, setTiresList] = useState(['إطار 16 انش', 'إطار 17 انش', 'إطار شاحنات 22.5']);

  // Prices Coded by Admin
  const [prices, setPrices] = useState({
    fuelPerLiter: 500,
    oilPerLiter: 2500,
    batteryDefault: 45000,
    tireDefault: 35000,
  });

  // Requests Data
  const [requests, setRequests] = useState<any[]>([
    {
      id: 'REQ-1001',
      carId: '22618',
      driver: 'عبد الغني علي دحان',
      type: 'وقود',
      date: '2026-10-01',
      quantity: 50,
      totalPrice: 25000,
      station: 'محطة الشركة',
      allocation: 'مخصص شهري',
      notes: 'تعبئة خط سفر',
      status: '🟢 تم الاعتماد',
      attachment: null,
    },
    {
      id: 'REQ-1002',
      carId: '22618',
      driver: 'عبد الغني علي دحان',
      type: 'زيوت',
      date: '2026-10-01',
      oilType: 'تويوتا',
      quantity: 4,
      totalPrice: 10000,
      prevOdometer: 120000,
      currOdometer: 125000,
      distance: 5000,
      notes: 'تغيير زيت وفلتر',
      status: '🟡 قيد المراجعة',
      attachment: null,
    }
  ]);

  // Permissions state per driver carId
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  // Driver Request Form States
  const [serviceType, setServiceType] = useState('وقود');
  const [fuelQty, setFuelQty] = useState('');
  const [selectedStation, setSelectedStation] = useState(stations[0]);
  const [selectedAllocation, setSelectedAllocation] = useState(allocations[0]);
  const [requestNotes, setRequestNotes] = useState('');

  // Oils Form
  const [selectedOil, setSelectedOil] = useState(oils[0]);
  const [oilQty, setOilQty] = useState('');
  const [currOdometer, setCurrOdometer] = useState('');

  // Other Request Forms
  const [selectedItem, setSelectedItem] = useState('');
  const [customCost, setCustomCost] = useState('');

  // Modals for Admin Editing
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Admin New/Edit Car Modal
  const [carModalVisible, setCarModalVisible] = useState(false);
  const [carForm, setCarForm] = useState({ id: '', name: '', driver: '', type: '', model: '', status: 'في الخدمة', capacity: '', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' });

  // Notifications Alert Banner
  const [unreadCount, setUnreadCount] = useState(1);

  // ==========================================
  // LOGIN LOGIC
  // ==========================================
  const handleLogin = () => {
    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    // Check Admin
    if (trimmedUser === 'ميثاق' && (trimmedPass === (userPasswords['ميثاق'] || '111'))) {
      setUser({ role: 'admin', name: 'ميثاق (المدير المسؤول)' });
      setUsernameInput('');
      setPasswordInput('');
      return;
    }

    // Check Driver by Car ID
    const foundCar = fleetData.find(c => c.id === trimmedUser);
    if (foundCar) {
      if (foundCar.status === 'موقف') {
        Alert.alert('تنبيه', 'هذه السيارة متوقفة حالياً عن الخدمة ولا يمكن تسجيل الدخول بها.');
        return;
      }
      const expectedPass = userPasswords[trimmedUser] || '000';
      if (trimmedPass === expectedPass) {
        setUser({ role: 'driver', car: foundCar });
        setUsernameInput('');
        setPasswordInput('');
        return;
      }
    }

    Alert.alert('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('request');
  };

  // Get previous odometer reading for a car
  const getPreviousOdometer = (carId: string) => {
    const oilReqs = requests.filter(r => r.carId === carId && r.type === 'زيوت' && r.currOdometer);
    if (oilReqs.length > 0) {
      return oilReqs[oilReqs.length - 1].currOdometer;
    }
    return 100000; // Default previous reading
  };

  // ==========================================
  // SUBMIT REQUEST
  // ==========================================
  const handleSubmitRequest = () => {
    if (!user || user.role !== 'driver') return;
    const carId = user.car.id;

    let newReq: any = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      carId: carId,
      driver: user.car.driver,
      type: serviceType,
      date: new Date().toISOString().split('T')[0],
      notes: requestNotes,
      status: '🟡 قيد المراجعة',
      attachment: 'مرفق_صورة.jpg'
    };

    if (serviceType === 'وقود') {
      const qty = parseFloat(fuelQty) || 0;
      if (qty <= 0) { Alert.alert('خطأ', 'يرجى إدخال كمية صحيحة'); return; }
      newReq.quantity = qty;
      newReq.totalPrice = qty * prices.fuelPerLiter;
      newReq.station = selectedStation;
      newReq.allocation = selectedAllocation;
    } else if (serviceType === 'زيوت') {
      const qty = parseFloat(oilQty) || 0;
      const currOdo = parseFloat(currOdometer) || 0;
      const prevOdo = getPreviousOdometer(carId);
      if (qty <= 0 || currOdo <= prevOdo) {
        Alert.alert('خطأ', 'يرجى التحقق من الكمية وقراءة العداد الحالي (يجب أن تكون أكبر من العداد السابق)');
        return;
      }
      newReq.oilType = selectedOil;
      newReq.quantity = qty;
      newReq.totalPrice = qty * prices.oilPerLiter;
      newReq.prevOdometer = prevOdo;
      newReq.currOdometer = currOdo;
      newReq.distance = currOdo - prevOdo;
    } else {
      newReq.item = selectedItem || serviceType;
      newReq.totalPrice = parseFloat(customCost) || 15000;
    }

    setRequests([newReq, ...requests]);
    setUnreadCount(unreadCount + 1);
    Alert.alert('تم بنجاح', 'تم تقديم الطلب وهو قيد المراجعة الآن');
    // Reset forms
    setFuelQty('');
    setOilQty('');
    setCurrOdometer('');
    setRequestNotes('');
  };

  // Update status (Admin approval)
  const handleApproveRequest = (id: string, newStatus: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  // ==========================================
  // RENDER LOGIN SCREEN
  // ==========================================
  if (!user) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>تسجيل الدخول</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>اسم المستخدم / رقم السيارة</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل اسم المستخدم أو رقم السيارة"
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل كلمة المرور"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>دخول</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>الإصدار: {APP_VERSION} (البناء {APP_BUILD})</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // DRIVER DASHBOARD
  // ==========================================
  if (user.role === 'driver') {
    const car = user.car;
    const myRequestsList = requests.filter(r => r.carId === car.id);

    return (
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="light-content" />
        {/* Header with car & driver details */}
        <View style={styles.driverHeader}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.headerCarText}>🚘 رقم السيارة: {car.id}</Text>
              <Text style={styles.headerDriverText}>👤 السائق: {car.driver}</Text>
            </View>
            <Text style={styles.headerBadge}>سائق</Text>
          </View>
        </View>

        {/* Content Tabs */}
        <View style={{ flex: 1, padding: 12 }}>
          {activeTab === 'request' && (
            <ScrollView style={styles.tabContent}>
              <Text style={styles.sectionTitle}>📝 تقديم طلب خدمة جديد</Text>

              {/* Service Type Buttons */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15, flexDirection: 'row-reverse' }}>
                {['وقود', 'زيوت', 'قطع غيار', 'صيانة', 'إطارات', 'بطاريات'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, serviceType === t && styles.typeChipActive]}
                    onPress={() => setServiceType(t)}
                  >
                    <Text style={[styles.typeChipText, serviceType === t && styles.typeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Form by Service Type */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>بيانات طلب {serviceType}</Text>
                <Text style={styles.infoLabel}>رقم العملية: (تلقائي)</Text>
                <Text style={styles.infoLabel}>التاريخ: {new Date().toISOString().split('T')[0]}</Text>

                {serviceType === 'وقود' && (
                  <>
                    <Text style={styles.label}>المحطة:</Text>
                    <ScrollView horizontal style={{ marginBottom: 10 }}>
                      {stations.map(st => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.smallChip, selectedStation === st && styles.smallChipActive]}
                          onPress={() => setSelectedStation(st)}
                        >
                          <Text style={selectedStation === st ? styles.whiteText : styles.darkText}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.label}>المخصص (المنطقة/الشهري):</Text>
                    <ScrollView horizontal style={{ marginBottom: 10 }}>
                      {allocations.map(al => (
                        <TouchableOpacity
                          key={al}
                          style={[styles.smallChip, selectedAllocation === al && styles.smallChipActive]}
                          onPress={() => setSelectedAllocation(al)}
                        >
                          <Text style={selectedAllocation === al ? styles.whiteText : styles.darkText}>{al}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.label}>الكمية (لتر):</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="أدخل عدد اللترات"
                      value={fuelQty}
                      onChangeText={setFuelQty}
                    />
                    <Text style={styles.calcText}>
                      💰 الإجمالي التلقائي: {(parseFloat(fuelQty) || 0) * prices.fuelPerLiter} ريال (سعر اللتر: {prices.fuelPerLiter})
                    </Text>
                  </>
                )}

                {serviceType === 'زيوت' && (
                  <>
                    <Text style={styles.label}>نوع الزيت:</Text>
                    <ScrollView horizontal style={{ marginBottom: 10 }}>
                      {oils.map(o => (
                        <TouchableOpacity
                          key={o}
                          style={[styles.smallChip, selectedOil === o && styles.smallChipActive]}
                          onPress={() => setSelectedOil(o)}
                        >
                          <Text style={selectedOil === o ? styles.whiteText : styles.darkText}>{o}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.label}>الكمية (لتر):</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={oilQty} onChangeText={setOilQty} placeholder="الكمية" />

                    <Text style={styles.readOnlyField}>📟 العداد السابق (تلقائي): {getPreviousOdometer(car.id)} كم</Text>

                    <Text style={styles.label}>📟 العداد الحالي:</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="أدخل قراءة العداد الحالية"
                      value={currOdometer}
                      onChangeText={setCurrOdometer}
                    />

                    {parseFloat(currOdometer) > getPreviousOdometer(car.id) && (
                      <Text style={styles.calcText}>
                        🛣️ المسافة المقطوعة التلقائية: {parseFloat(currOdometer) - getPreviousOdometer(car.id)} كم
                      </Text>
                    )}
                  </>
                )}

                {['قطع غيار', 'صيانة', 'إطارات', 'بطاريات'].includes(serviceType) && (
                  <>
                    <Text style={styles.label}>البند المطلوبة:</Text>
                    <TextInput style={styles.input} placeholder="أدخل تفاصيل البند أو القطعة" value={selectedItem} onChangeText={setSelectedItem} />
                    <Text style={styles.label}>التكلفة التقديرية (إن وجدت):</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="التكلفة" value={customCost} onChangeText={setCustomCost} />
                  </>
                )}

                <Text style={styles.label}>الملاحظات:</Text>
                <TextInput style={styles.input} placeholder="أدخل أي ملاحظات إضافية" value={requestNotes} onChangeText={setRequestNotes} />

                <TouchableOpacity style={styles.attachButton} onPress={() => Alert.alert('كاميرا / معرض', 'تم إرفاق الصورة بنجاح')}>
                  <Text style={styles.attachText}>📷 إرفاق صورة / فاتورة (كاميرا/معرض)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRequest}>
                  <Text style={styles.submitBtnText}>إرسال الطلب</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {activeTab === 'myRequests' && (
            <ScrollView style={styles.tabContent}>
              <Text style={styles.sectionTitle}>📋 طلباتي المسجلة</Text>
              {myRequestsList.length === 0 ? (
                <Text style={styles.emptyText}>لا توجد طلبات سابقة</Text>
              ) : (
                myRequestsList.map(item => (
                  <View key={item.id} style={styles.card}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                      <Text style={styles.boldText}>{item.type} - {item.id}</Text>
                      <Text style={[
                        styles.statusBadge,
                        item.status.includes('الاعتماد') ? styles.bgGreen : item.status.includes('مرفوض') ? styles.bgRed : styles.bgYellow
                      ]}>{item.status}</Text>
                    </View>
                    <Text style={styles.subText}>📅 التاريخ: {item.date}</Text>
                    {item.quantity && <Text style={styles.subText}>الكمية: {item.quantity}</Text>}
                    {item.totalPrice && <Text style={styles.subText}>المبلغ: {item.totalPrice} ريال</Text>}
                    {item.notes ? <Text style={styles.subText}>ملاحظات: {item.notes}</Text> : null}
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {activeTab === 'carData' && (
            <ScrollView style={styles.tabContent}>
              {/* Special Top Header with Big Back Arrow matching custom spec */}
              <View style={styles.carDataHeader}>
                <TouchableOpacity onPress={() => setActiveTab('request')} style={styles.backArrowBtn}>
                  <Text style={styles.backArrowText}>➔</Text>
                </TouchableOpacity>
                <Text style={styles.carDataHeaderTitle}>بيانات سيارتي الحالية</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>اسم السيارة:</Text><Text style={styles.dataValue}>{car.name}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>رقم السيارة:</Text><Text style={styles.dataValue}>{car.id}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>اسم السائق:</Text><Text style={styles.dataValue}>{car.driver}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>نوع السيارة:</Text><Text style={styles.dataValue}>{car.type}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>الموديل:</Text><Text style={styles.dataValue}>{car.model}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>الحمولة:</Text><Text style={styles.dataValue}>{car.capacity}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>نوع النقل:</Text><Text style={styles.dataValue}>{car.transportType}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>عدد الركاب:</Text><Text style={styles.dataValue}>{car.passengers}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>نوع الوقود:</Text><Text style={styles.dataValue}>{car.fuelType}</Text></View>
                <View style={styles.dataRow}><Text style={styles.dataLabel}>حالة السيارة:</Text><Text style={[styles.dataValue, { color: 'green' }]}>{car.status}</Text></View>
              </View>
            </ScrollView>
          )}

          {activeTab === 'reports' && (
            <ScrollView style={styles.tabContent}>
              <Text style={styles.sectionTitle}>📊 التقارير والاستعلامات</Text>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>إجمالي المصاريف المعتمدة</Text>
                <Text style={styles.summaryText}>⛽ إجمالي الوقود: {myRequestsList.filter(r => r.type === 'وقود' && r.status.includes('الاعتماد')).reduce((acc, c) => acc + (c.totalPrice || 0), 0)} ريال</Text>
                <Text style={styles.summaryText}>🛢️ إجمالي الزيوت: {myRequestsList.filter(r => r.type === 'زيوت' && r.status.includes('الاعتماد')).reduce((acc, c) => acc + (c.totalPrice || 0), 0)} ريال</Text>
                <Text style={styles.summaryText}>🛠️ إجمالي الصيانة والقطع: {myRequestsList.filter(r => ['صيانة', 'قطع غيار', 'إطارات', 'بطاريات'].includes(r.type) && r.status.includes('الاعتماد')).reduce((acc, c) => acc + (c.totalPrice || 0), 0)} ريال</Text>
              </View>
            </ScrollView>
          )}

          {activeTab === 'settings' && (
            <ScrollView style={styles.tabContent}>
              <Text style={styles.sectionTitle}>⚙️ إعدادات الحساب</Text>

              <View style={styles.card}>
                <View style={styles.editRow}>
                  <Text style={styles.label}>اسم السائق: {car.driver}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('تعديل', 'طلب تغيير اسم السائق')}><Text style={styles.editIcon}>✏️</Text></TouchableOpacity>
                </View>
                <View style={styles.editRow}>
                  <Text style={styles.label}>اسم السيارة: {car.name}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('تعديل', 'طلب تغيير اسم السيارة')}><Text style={styles.editIcon}>✏️</Text></TouchableOpacity>
                </View>

                <Text style={[styles.label, { marginTop: 15 }]}>تغيير كلمة المرور:</Text>
                <TextInput style={styles.input} secureTextEntry placeholder="كلمة المرور الجديدة" />
                <TouchableOpacity style={styles.smallBtn} onPress={() => Alert.alert('تم', 'تم تغيير كلمة المرور')}>
                  <Text style={styles.smallBtnText}>حفظ كلمة المرور</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>🚪 تسجيل الخروج</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Driver Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => setActiveTab('request')} style={styles.navItem}>
            <Text style={activeTab === 'request' ? styles.navActive : styles.navText}>طلب خدمة</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('myRequests')} style={styles.navItem}>
            <Text style={activeTab === 'myRequests' ? styles.navActive : styles.navText}>طلباتي</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('carData')} style={styles.navItem}>
            <Text style={activeTab === 'carData' ? styles.navActive : styles.navText}>سيارتي</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('reports')} style={styles.navItem}>
            <Text style={activeTab === 'reports' ? styles.navActive : styles.navText}>التقارير</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('settings')} style={styles.navItem}>
            <Text style={activeTab === 'settings' ? styles.navActive : styles.navText}>الإعدادات</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      {/* Admin Top Banner & Notifications */}
      <View style={styles.adminHeader}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.adminTitle}>لوحة تحكم المسؤول (ميثاق)</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderBtn}>
            <Text style={{ color: '#fff', fontSize: 12 }}>خروج</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.adminSub}>إدارة الأسطول، التكويدات والاعتمادات</Text>
      </View>

      {/* Admin Tabs Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adminTabsBar}>
        {[
          { key: 'codings', title: 'التكويدات والأسعار' },
          { key: 'requests', title: `طلبات السائقين (${requests.length})` },
          { key: 'fleet', title: 'إدارة السيارات' },
          { key: 'drivers', title: 'بيانات السائقين' },
          { key: 'linkage', title: 'ربط السيارات' },
          { key: 'permissions', title: 'الصلاحيات' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.adminTabChip, adminTab === tab.key && styles.adminTabChipActive]}
            onPress={() => setAdminTab(tab.key)}
          >
            <Text style={[styles.adminTabText, adminTab === tab.key && styles.adminTabTextActive]}>{tab.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Admin Content Area */}
      <View style={{ flex: 1, padding: 10 }}>
        {adminTab === 'codings' && (
          <ScrollView>
            <Text style={styles.sectionTitle}>⚙️ تكويد البيانات والأسعار</Text>

            {/* Price Coding Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💵 تكويد الأسعار المعتمدة (تلقائية للمستخدمين)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.label}>سعر لتر الوقود:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={String(prices.fuelPerLiter)}
                  onChangeText={v => setPrices({ ...prices, fuelPerLiter: parseFloat(v) || 0 })}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>سعر لتر الزيت:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={String(prices.oilPerLiter)}
                  onChangeText={v => setPrices({ ...prices, oilPerLiter: parseFloat(v) || 0 })}
                />
              </View>
            </View>

            {/* Coded Lists with Edit and Delete */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⛽ تكويد المحطات</Text>
              {stations.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text>{item}</Text>
                  <View style={{ flexDirection: 'row-reverse' }}>
                    <TouchableOpacity onPress={() => { setModalType('stations'); setEditIndex(idx); setNewItemText(item); setModalVisible(true); }}>
                      <Text style={styles.btnEdit}>تعديل✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStations(stations.filter((_, i) => i !== idx))}>
                      <Text style={styles.btnDelete}>حذف🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={() => { setModalType('stations'); setEditIndex(null); setNewItemText(''); setModalVisible(true); }}>
                <Text style={styles.addBtnText}>+ إضافة محطة جديد</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛢️ تكويد أنواع الزيوت</Text>
              {oils.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text>{item}</Text>
                  <View style={{ flexDirection: 'row-reverse' }}>
                    <TouchableOpacity onPress={() => { setModalType('oils'); setEditIndex(idx); setNewItemText(item); setModalVisible(true); }}>
                      <Text style={styles.btnEdit}>تعديل✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setOils(oils.filter((_, i) => i !== idx))}>
                      <Text style={styles.btnDelete}>حذف🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={() => { setModalType('oils'); setEditIndex(null); setNewItemText(''); setModalVisible(true); }}>
                <Text style={styles.addBtnText}>+ إضافة نوع زيت</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>📍 تكويد المخصصات (المحافظات/الشهري)</Text>
              {allocations.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text>{item}</Text>
                  <View style={{ flexDirection: 'row-reverse' }}>
                    <TouchableOpacity onPress={() => { setModalType('allocations'); setEditIndex(idx); setNewItemText(item); setModalVisible(true); }}>
                      <Text style={styles.btnEdit}>تعديل✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAllocations(allocations.filter((_, i) => i !== idx))}>
                      <Text style={styles.btnDelete}>حذف🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {adminTab === 'requests' && (
          <ScrollView>
            <Text style={styles.sectionTitle}>📥 طلبات السائقين والموظفين الواردة</Text>
            {requests.map(req => (
              <View key={req.id} style={styles.card}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={styles.boldText}>{req.type} | سيارة: {req.carId} ({req.driver})</Text>
                  <Text style={[styles.statusBadge, req.status.includes('الاعتماد') ? styles.bgGreen : req.status.includes('مرفوض') ? styles.bgRed : styles.bgYellow]}>{req.status}</Text>
                </View>
                <Text style={styles.subText}>رقم العملية: {req.id} - التاريخ: {req.date}</Text>
                {req.quantity && <Text style={styles.subText}>الكمية: {req.quantity} - المبلغ: {req.totalPrice} ريال</Text>}
                {req.station && <Text style={styles.subText}>المحطة: {req.station} - المخصص: {req.allocation}</Text>}
                {req.notes ? <Text style={styles.subText}>ملاحظات: {req.notes}</Text> : null}

                <View style={{ flexDirection: 'row-reverse', marginTop: 10, justifyContent: 'space-around' }}>
                  <TouchableOpacity style={[styles.actionBtn, styles.bgGreen]} onPress={() => handleApproveRequest(req.id, '🟢 تم الاعتماد')}>
                    <Text style={styles.whiteText}>اعتماد الطلب ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.bgRed]} onPress={() => handleApproveRequest(req.id, '🔴 مرفوض')}>
                    <Text style={styles.whiteText}>رفض الطلب ✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {adminTab === 'fleet' && (
          <ScrollView>
            <Text style={styles.sectionTitle}>🚘 إدارة الأسطول والسيارات ({fleetData.length} سيارة)</Text>

            <TouchableOpacity style={styles.addBtn} onPress={() => {
              setCarForm({ id: '', name: '', driver: '', type: '', model: '', status: 'في الخدمة', capacity: '', fuelType: 'بترول', passengers: 5, transportType: 'شخصي' });
              setCarModalVisible(true);
            }}>
              <Text style={styles.addBtnText}>+ إضافة سيارة جديدة</Text>
            </TouchableOpacity>

            {fleetData.map(car => (
              <View key={car.id} style={styles.card}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={styles.boldText}>رقم: {car.id} - {car.name}</Text>
                  <Text style={{ color: car.status === 'في الخدمة' ? 'green' : 'red', fontWeight: 'bold' }}>{car.status}</Text>
                </View>
                <Text style={styles.subText}>السائق: {car.driver} | الموديل: {car.model} | الوقود: {car.fuelType}</Text>

                <View style={{ flexDirection: 'row-reverse', marginTop: 8 }}>
                  <TouchableOpacity style={styles.smallToggleBtn} onPress={() => {
                    const newStatus = car.status === 'في الخدمة' ? 'موقف' : 'في الخدمة';
                    setFleetData(fleetData.map(c => c.id === car.id ? { ...c, status: newStatus } : c));
                  }}>
                    <Text style={{ color: '#fff', fontSize: 11 }}>تغيير الحالة (إيقاف/تشغيل)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Edit Item Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>{editIndex !== null ? 'تعديل بند' : 'إضافة بند جديد'}</Text>
            <TextInput style={styles.input} value={newItemText} onChangeText={setNewItemText} placeholder="أدخل النص..." />
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 15 }}>
              <TouchableOpacity style={styles.smallBtn} onPress={() => {
                let targetList = modalType === 'stations' ? stations : modalType === 'oils' ? oils : allocations;
                let setTarget = modalType === 'stations' ? setStations : modalType === 'oils' ? setOils : setAllocations;
                if (editIndex !== null) {
                  const updated = [...targetList];
                  updated[editIndex] = newItemText;
                  setTarget(updated);
                } else {
                  setTarget([...targetList, newItemText]);
                }
                setModalVisible(false);
              }}>
                <Text style={styles.smallBtnText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#777' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.smallBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Car Modal */}
      <Modal visible={carModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.cardTitle}>إضافة سيارة جديدة</Text>
            <TextInput style={styles.input} placeholder="رقم السيارة" value={carForm.id} onChangeText={v => setCarForm({ ...carForm, id: v })} />
            <TextInput style={styles.input} placeholder="اسم السيارة الكامل" value={carForm.name} onChangeText={v => setCarForm({ ...carForm, name: v })} />
            <TextInput style={styles.input} placeholder="اسم السائق" value={carForm.driver} onChangeText={v => setCarForm({ ...carForm, driver: v })} />
            <TextInput style={styles.input} placeholder="الموديل" value={carForm.model} onChangeText={v => setCarForm({ ...carForm, model: v })} />
            <TouchableOpacity style={styles.smallBtn} onPress={() => {
              if (!carForm.id) return;
              setFleetData([...fleetData, carForm]);
              setCarModalVisible(false);
            }}>
              <Text style={styles.smallBtnText}>حفظ السيارة</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#f4f6f9', justifyContent: 'center', alignItems: 'center' },
  loginBox: { width: '85%', backgroundColor: '#ffffff', padding: 25, borderRadius: 12, elevation: 4 },
  loginTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1a365d' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, color: '#4a5568', marginBottom: 5, textAlign: 'right', fontWeight: '600' },
  input: { borderBottomWidth: 1, borderBottomColor: '#cbd5e0', paddingVertical: 8, fontSize: 14, textAlign: 'right' },
  loginButton: { backgroundColor: '#2b6cb0', paddingVertical: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  loginButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  versionFooter: { marginTop: 25, alignItems: 'center' },
  versionText: { color: '#a0aec0', fontSize: 12 },

  mainContainer: { flex: 1, backgroundColor: '#f0f4f8' },
  driverHeader: { backgroundColor: '#1a365d', padding: 15, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  headerCarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  headerDriverText: { color: '#e2e8f0', fontSize: 13, textAlign: 'right', marginTop: 2 },
  headerBadge: { backgroundColor: '#2b6cb0', color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11 },

  tabContent: { flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#2d3748', marginBottom: 12, textAlign: 'right' },
  typeChip: { backgroundColor: '#e2e8f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginLeft: 8 },
  typeChipActive: { backgroundColor: '#2b6cb0' },
  typeChipText: { color: '#4a5568', fontSize: 13 },
  typeChipTextActive: { color: '#ffffff', fontWeight: 'bold' },

  card: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#2b6cb0', marginBottom: 10, textAlign: 'right' },
  infoLabel: { fontSize: 12, color: '#718096', textAlign: 'right', marginBottom: 4 },
  calcText: { color: '#2b6cb0', fontWeight: 'bold', fontSize: 12, marginVertical: 6, textAlign: 'right' },
  readOnlyField: { backgroundColor: '#edf2f7', padding: 8, borderRadius: 6, marginVertical: 6, textAlign: 'right', fontSize: 13, color: '#4a5568' },

  smallChip: { backgroundColor: '#edf2f7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginLeft: 6 },
  smallChipActive: { backgroundColor: '#319795' },
  whiteText: { color: '#fff', fontSize: 12 },
  darkText: { color: '#2d3748', fontSize: 12 },

  attachButton: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#a0aec0', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  attachText: { color: '#4a5568', fontSize: 12 },
  submitBtn: { backgroundColor: '#276749', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bgGreen: { backgroundColor: '#38a169' },
  bgYellow: { backgroundColor: '#d69e2e' },
  bgRed: { backgroundColor: '#e53e3e' },
  boldText: { fontWeight: 'bold', fontSize: 14, color: '#2d3748' },
  subText: { fontSize: 12, color: '#718096', textAlign: 'right', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#a0aec0', marginTop: 30 },

  carDataHeader: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#2b6cb0', padding: 12, borderRadius: 8, marginBottom: 12 },
  backArrowBtn: { paddingHorizontal: 10 },
  backArrowText: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  carDataHeaderTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  dataRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
  dataLabel: { color: '#718096', fontSize: 13 },
  dataValue: { color: '#2d3748', fontWeight: 'bold', fontSize: 13 },

  summaryText: { fontSize: 14, color: '#2d3748', marginVertical: 4, textAlign: 'right' },
  editRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf2f7', paddingVertical: 8 },
  editIcon: { fontSize: 16 },
  logoutBtn: { backgroundColor: '#c53030', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  bottomNav: { flexDirection: 'row-reverse', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { color: '#718096', fontSize: 11 },
  navActive: { color: '#2b6cb0', fontWeight: 'bold', fontSize: 11 },

  adminHeader: { backgroundColor: '#1a202c', padding: 12 },
  adminTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'right' },
  adminSub: { color: '#a0aec0', fontSize: 11, textAlign: 'right' },
  logoutHeaderBtn: { backgroundColor: '#e53e3e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  adminTabsBar: { backgroundColor: '#2d3748', paddingVertical: 6, flexDirection: 'row-reverse' },
  adminTabChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 6 },
  adminTabChipActive: { backgroundColor: '#3182ce' },
  adminTabText: { color: '#cbd5e0', fontSize: 12 },
  adminTabTextActive: { color: '#fff', fontWeight: 'bold' },

  inputRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4 },
  smallInput: { borderBottomWidth: 1, borderBottomColor: '#cbd5e0', width: 80, textAlign: 'center', fontSize: 13 },
  itemRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
  btnEdit: { color: '#3182ce', fontSize: 12, marginLeft: 10 },
  btnDelete: { color: '#e53e3e', fontSize: 12 },
  addBtn: { backgroundColor: '#ebf8ff', padding: 8, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: '#3182ce', fontWeight: 'bold', fontSize: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  smallToggleBtn: { backgroundColor: '#4a5568', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  smallBtn: { backgroundColor: '#3182ce', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  smallBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});

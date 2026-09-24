import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

type Role = 'Admin' | 'Driver';
type RequestType = 'محروقات' | 'زيوت' | 'قطع غيار' | 'صيانة' | 'تائرات';
type RequestStatus = 'قيد الانتظار' | 'تمت الموافقة' | 'مرفوض';

interface CarData {
  carNumber: string;
  carName: string;
  driverName: string;
  model: string;
  fuelType: 'ديزل' | 'بترول';
  transportType: 'ثقيل' | 'خفيف' | 'ركاب' | 'خدمات';
  lastOdometer: number;
}

interface DriverInfo {
  id: string;
  driverName: string;
  phone: string;
  jobTitle: string;
  carNumber: string;
}

interface User {
  username: string;
  password: string;
  role: Role;
  carNumber: string;
  driverName: string;
}

interface ServiceRequest {
  id: string;
  driverUsername: string;
  driverName: string;
  carNumber: string;
  type: RequestType;
  dateTime: string;
  quantityLiters?: number;
  unitPrice?: number;
  stationName?: string;
  allocationRegion?: string;
  oilType?: string;
  previousOdometer?: number;
  currentOdometer?: number;
  distanceTraveled?: number;
  totalCost: number;
  details?: string;
  status: RequestStatus;
}

const INITIAL_CARS: CarData[] = [
  { carNumber: '22618', carName: 'قاطرة فولفو 2002رقم 22618', driverName: 'عبد الغني علي دحان', model: '2002', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 150000 },
  { carNumber: '36040', carName: 'شاحنة فولفو2013 رقم 36040', driverName: 'حافظ عبده محمد النينه', model: '2013', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 120000 },
  { carNumber: '28336', carName: 'متسوبيشي فوزو 2012رقم 28336', driverName: 'عبد الله احمد عبد الله', model: '2012', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 98000 },
  { carNumber: '31538', carName: 'ايسوزو2016 رقم 31538', driverName: 'خالد عثمان سعيد', model: '2016', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 75000 },
  { carNumber: '34552', carName: 'ايسوزو 2015 رقم 34552', driverName: 'عبد الاله محمد احمد', model: '2015', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 82000 },
  { carNumber: '33230', carName: 'بابور اسيوزا2016 رقم  33230', driverName: 'سامي عبدالنور', model: '2016', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 64000 },
  { carNumber: '34208', carName: 'ايسوزو2020 رقم 34208', driverName: 'محمد عبده محمد', model: '2020', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 45000 },
  { carNumber: '28807', carName: 'دينا متسوبيشي2012 رقم 28807', driverName: 'عفيف سعيد محمد', model: '2012', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 110000 },
  { carNumber: '29485', carName: 'دينا متسوبيشي2013 رقم 29485', driverName: 'حمود سرحان', model: '2013', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 105000 },
  { carNumber: '30646', carName: 'دينا متسوبيشي 2014رقم 30646', driverName: 'عبده محمد النينه', model: '2014', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 95000 },
  { carNumber: '36697', carName: 'دينا متسوبيشي2013 رقم 36697', driverName: 'حسام عبده سالم', model: '2013', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 89000 },
  { carNumber: '34451', carName: 'باص كوستر 2012', driverName: 'عماد علي دحان', model: '2012', fuelType: 'ديزل', transportType: 'ركاب', lastOdometer: 130000 },
  { carNumber: '23317', carName: 'دايهاتسو قلاب موديل 2004', driverName: 'محمدمحسن', model: '2004', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 160000 },
  { carNumber: '28185', carName: 'دينا متسوبيشي2010', driverName: 'عبد الغني على دحان', model: '2010', fuelType: 'ديزل', transportType: 'ثقيل', lastOdometer: 140000 },
  { carNumber: '31457', carName: 'لاندكروزر صالون2012', driverName: 'رشاد عبدالحميد', model: '2012', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 115000 },
  { carNumber: '46383', carName: 'رافور تويوتا 2020', driverName: 'حمدي شريف', model: '2020', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 35000 },
  { carNumber: '29732', carName: 'لاندكروزر صالون2011', driverName: 'عامرمحمد علي نعمان', model: '2011', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 125000 },
  { carNumber: '139614', carName: 'رافور تويوتا 2020', driverName: 'وسيم عامر محمد علي', model: '2020', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 42000 },
  { carNumber: '161777', carName: 'تويوتا رافور 2021', driverName: 'احمد لطفي عبد الحميد', model: '2021', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 28000 },
  { carNumber: '53665', carName: 'جيب2014', driverName: 'وهيب عبدالحميد', model: '2014', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 92000 },
  { carNumber: '27750', carName: 'فرتشنار تويوتا 2010', driverName: 'لطفي سعيد علي', model: '2010', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 135000 },
  { carNumber: '30551', carName: 'فرتشنار تويوتا 2014', driverName: 'عبدالله الوردي', model: '2014', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 88000 },
  { carNumber: '29015', carName: 'هيلوكس غمارة 2010', driverName: 'ماجد عبده فارع', model: '2010', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 142000 },
  { carNumber: '13287', carName: 'هيلوكس غمارتين ديزل 2014', driverName: 'مروان الفقية', model: '2014', fuelType: 'ديزل', transportType: 'خفيف', lastOdometer: 99000 },
  { carNumber: '44972', carName: 'سوزكي جيمني 2015', driverName: 'صابر جواد', model: '2015', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 71000 },
  { carNumber: '25749', carName: 'هيلوكس غماره  2013', driverName: 'محمد عبد القوي الشوافي', model: '2013', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 108000 },
  { carNumber: '26519', carName: 'هليوكس غمارتين2008', driverName: 'الخدمات', model: '2008', fuelType: 'بترول', transportType: 'خدمات', lastOdometer: 175000 },
  { carNumber: '20040', carName: 'هواندي توسان2012', driverName: 'محمدالنعماني', model: '2012', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 118000 },
  { carNumber: '45551', carName: 'زوكي جمني2013', driverName: 'عبد الله مكرد', model: '2013', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 86000 },
  { carNumber: '19404', carName: 'باص كوستر 2004', driverName: 'يزيد عبد الواسع', model: '2004', fuelType: 'ديزل', transportType: 'ركاب', lastOdometer: 185000 },
  { carNumber: '46166', carName: 'دايهاتسو-تريوس', driverName: 'سالم', model: '2013', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 69000 },
  { carNumber: '34189', carName: 'هواندي توسان 2014', driverName: 'رمزي الماريو', model: '2014', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 94000 },
  { carNumber: '46379', carName: 'فوشنار 2015', driverName: 'عبدالفتاح درهم', model: '2015', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 78000 },
  { carNumber: '43166', carName: 'دايهاتسو تريوس 2013', driverName: 'هاني فيصل', model: '2013', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 83000 },
  { carNumber: '46140', carName: 'باص كوستر  2012 جديد  بدون رقم', driverName: 'جميل قائد سعيد', model: '2012', fuelType: 'ديزل', transportType: 'ركاب', lastOdometer: 120000 },
  { carNumber: '27949', carName: 'دايهاتسو طويل2010رقم27949', driverName: 'مصطفى المخلافي', model: '2010', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 131000 },
  { carNumber: '54446', carName: 'هونداي توسان 2020', driverName: 'محمد صادق سليمان', model: '2020', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 38000 },
  { carNumber: '54825', carName: 'هونداي توسان 2020', driverName: 'اشرف عبد القادر', model: '2020', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 36000 },
  { carNumber: '43661', carName: 'دايهاتسو تريوس 2015', driverName: 'سالم باوزير', model: '2015', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 67000 },
  { carNumber: '16501', carName: 'هيلوكس غماره 2014', driverName: 'اشرف محفوظ', model: '2014', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 91000 },
  { carNumber: '43998', carName: 'تويوتا هيلوكس غمارتين دبل 2021', driverName: 'عبدالرقيب عبدالوهاب', model: '2021', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 29000 },
  { carNumber: '49039', carName: 'تويوتا فور تشنر 2013', driverName: 'خالدالشراعي', model: '2013', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 102000 },
  { carNumber: '56989', carName: 'تويوتا فور تشنر 2015', driverName: 'نبيل الشوافي', model: '2015', fuelType: 'بترول', transportType: 'خفيف', lastOdometer: 74000 },
];

const INITIAL_USERS: User[] = [
  { username: 'ميثاق', password: '111', role: 'Admin', carNumber: 'إدارة', driverName: 'ميثاق عبده' },
  ...INITIAL_CARS.map((c) => ({
    username: c.carNumber,
    password: '000',
    role: 'Driver' as Role,
    carNumber: c.carNumber,
    driverName: c.driverName,
  })),
];

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [cars, setCars] = useState<CarData[]>(INITIAL_CARS);
  const [drivers, setDrivers] = useState<DriverInfo[]>(
    INITIAL_CARS.map((c, idx) => ({
      id: idx.toString(),
      driverName: c.driverName,
      phone: '770000000',
      jobTitle: 'سائق معدة / نقل',
      carNumber: c.carNumber,
    }))
  );

  const [stations, setStations] = useState<string[]>(['محطة الزبيدي', 'محطة الشركة', 'محطة نقدي']);
  const [regions, setRegions] = useState<string[]>(['تعز', 'صنعاء', 'عدن', 'الحديدة', 'إب', 'مأرب', 'حضرموت', 'شهري']);
  const [spareParts, setSpareParts] = useState<string[]>(['فلاتر هواء', 'فلاتر زيت', 'أقمشة فرامل', 'سيور']);
  const [oilTypes, setOilTypes] = useState<string[]>(['تويوتا', 'ليوكي مولي', 'ناشيونال']);
  const [batteries, setBatteries] = useState<string[]>(['بطارية هانكوك 70A', 'بطارية AC Delco 100A']);
  const [tires, setTires] = useState<string[]>(['إطارات يوكوهاما 16', 'إطارات ميشلان 22.5']);

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentTab, setCurrentTab] = useState<'home' | 'request_form' | 'reports' | 'cars' | 'drivers' | 'coding' | 'admin'>('home');
  const [requestType, setRequestType] = useState<RequestType>('محروقات');

  // عناصر التحكم بالقوائم المنسدلة
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [pickerItems, setPickerItems] = useState<string[]>([]);
  const [onSelectPicker, setOnSelectPicker] = useState<(val: string) => void>(() => {});

  // مدخلات النموذج
  const [requestDate, setRequestDate] = useState('2026-09-24');
  const [selectedStation, setSelectedStation] = useState('محطة الزبيدي');
  const [selectedRegion, setSelectedRegion] = useState('تعز');
  const [selectedOil, setSelectedOil] = useState('تويوتا');
  const [quantity, setQuantity] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [details, setDetails] = useState('');

  // مدخلات السائق الجديد
  const [dName, setDName] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dJob, setDJob] = useState('');
  const [dCarNo, setDCarNo] = useState('');

  // مدخلات التكويد
  const [codingActiveType, setCodingActiveType] = useState<string | null>(null);
  const [newCodingInput, setNewCodingInput] = useState('');

  // تسجيل الدخول
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const openPicker = (items: string[], onSelect: (val: string) => void) => {
    setPickerItems(items);
    setOnSelectPicker(() => onSelect);
    setPickerModalVisible(true);
  };

  const handleLogin = () => {
    const user = users.find((u) => u.username.trim() === loginUsername.trim() && u.password.trim() === loginPassword.trim());
    if (user) {
      setCurrentUser(user);
    } else {
      Alert.alert('خطأ', 'بيانات الدخول غير صحيحة');
    }
  };

  const handleSendRequest = () => {
    if (!currentUser) return;
    const qty = parseFloat(quantity) || 0;
    const cost = qty * 950;

    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      driverUsername: currentUser.username,
      driverName: currentUser.driverName,
      carNumber: currentUser.carNumber,
      type: requestType,
      dateTime: requestDate,
      quantityLiters: qty,
      stationName: selectedStation,
      allocationRegion: selectedRegion,
      oilType: selectedOil,
      totalCost: cost,
      details: details,
      status: 'قيد الانتظار',
    };

    setRequests([newReq, ...requests]);
    Alert.alert('تم بنجاح', 'تم إرسال الطلب إلى الإدارة');
    setQuantity('');
    setDetails('');
    setCurrentTab('home');
  };

  const handleAddDriver = () => {
    if (!dName || !dPhone) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم السائق ورقم الهاتف');
      return;
    }
    const newD: DriverInfo = {
      id: Date.now().toString(),
      driverName: dName,
      phone: dPhone,
      jobTitle: dJob || 'سائق',
      carNumber: dCarNo || 'غير محدد',
    };
    setDrivers([...drivers, newD]);
    Alert.alert('تم', 'تم إضافة بيانات السائق بنجاح');
    setDName('');
    setDPhone('');
    setDJob('');
    setDCarNo('');
  };

  const handleAddCodingItem = () => {
    if (!newCodingInput.trim()) return;
    if (codingActiveType === 'محطات') setStations([...stations, newCodingInput]);
    else if (codingActiveType === 'مخصصات') setRegions([...regions, newCodingInput]);
    else if (codingActiveType === 'قطع غيار') setSpareParts([...spareParts, newCodingInput]);
    else if (codingActiveType === 'زيوت') setOilTypes([...oilTypes, newCodingInput]);
    else if (codingActiveType === 'بطاريات') setBatteries([...batteries, newCodingInput]);
    else if (codingActiveType === 'إطارات') setTires([...tires, newCodingInput]);

    setNewCodingInput('');
    Alert.alert('تم', 'تم إضافة العنصر بنجاح');
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.authContainer}>
          <Text style={styles.appHeaderTitle}>السيارات - أطلس</Text>
          <View style={styles.cardBox}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>
            <TextInput style={styles.customInput} placeholder="رقم السيارة / اسم المستخدم" value={loginUsername} onChangeText={setLoginUsername} />
            <TextInput style={styles.customInput} placeholder="كلمة المرور (افتراضي 000)" secureTextEntry value={loginPassword} onChangeText={setLoginPassword} />
            <TouchableOpacity style={styles.redButton} onPress={handleLogin}>
              <Text style={styles.redButtonText}>دخول</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* الهيدر العلوي */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentTab('home')}>
          <Text style={styles.backBtnText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>
          {currentTab === 'home' && 'الرئيسية'}
          {currentTab === 'request_form' && 'طلب خدمة / محروقات'}
          {currentTab === 'reports' && 'التقارير والإستعلام'}
          {currentTab === 'cars' && 'بيانات السيارات'}
          {currentTab === 'drivers' && 'بيانات السائقين'}
          {currentTab === 'coding' && 'شاشة التكويد'}
          {currentTab === 'admin' && 'لوحة الإدارة'}
        </Text>
      </View>

      <ScrollView style={styles.mainContent}>
        {/* الواجهة الرئيسية - بطاقات الأيقونات مثل الصورة تماماً */}
        {currentTab === 'home' && (
          <View>
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeSub}>مساء الخير</Text>
              <Text style={styles.welcomeName}>{currentUser.driverName}</Text>
            </View>

            <TouchableOpacity style={styles.actionCard} onPress={() => { setRequestType('محروقات'); setCurrentTab('request_form'); }}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>طلب محروقات / زيوت</Text>
              <Text style={styles.cardIconEmoji}>⛽</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCurrentTab('reports')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>التقارير والإستعلام</Text>
              <Text style={styles.cardIconEmoji}>📊</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCurrentTab('cars')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>بيانات السيارات</Text>
              <Text style={styles.cardIconEmoji}>🚛</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCurrentTab('drivers')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>بيانات السائقين</Text>
              <Text style={styles.cardIconEmoji}>👨‍✈️</Text>
            </TouchableOpacity>

            {currentUser.role === 'Admin' && (
              <>
                <TouchableOpacity style={styles.actionCard} onPress={() => setCurrentTab('coding')}>
                  <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
                  <Text style={styles.cardLabelText}>شاشة التكويد</Text>
                  <Text style={styles.cardIconEmoji}>⚙️</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => setCurrentTab('admin')}>
                  <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
                  <Text style={styles.cardLabelText}>طلبات الموظفين الاعتماد</Text>
                  <Text style={styles.cardIconEmoji}>📋</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* نموذج الطلب - مع القوائم المنسدلة المحدثة */}
        {currentTab === 'request_form' && (
          <View>
            <View style={styles.topTabsRow}>
              <TouchableOpacity style={[styles.subTab, requestType === 'محروقات' && styles.subTabActive]} onPress={() => setRequestType('محروقات')}>
                <Text style={[styles.subTabText, requestType === 'محروقات' && styles.subTabTextActive]}>محروقات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subTab, requestType === 'زيوت' && styles.subTabActive]} onPress={() => setRequestType('زيوت')}>
                <Text style={[styles.subTabText, requestType === 'زيوت' && styles.subTabTextActive]}>زيوت</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formBoxCard}>
              <Text style={styles.fieldLabel}>التاريخ</Text>
              <TextInput style={styles.dropdownSelector} value={requestDate} onChangeText={setRequestDate} />

              <Text style={styles.fieldLabel}>اختر المحطة</Text>
              <TouchableOpacity style={styles.dropdownSelector} onPress={() => openPicker(stations, setSelectedStation)}>
                <Text style={styles.dropdownText}>{selectedStation} ▼</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>منطقة المخصص</Text>
              <TouchableOpacity style={styles.dropdownSelector} onPress={() => openPicker(regions, setSelectedRegion)}>
                <Text style={styles.dropdownText}>{selectedRegion} ▼</Text>
              </TouchableOpacity>

              {requestType === 'زيوت' && (
                <>
                  <Text style={styles.fieldLabel}>اختر نوع الزيت</Text>
                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openPicker(oilTypes, setSelectedOil)}>
                    <Text style={styles.dropdownText}>{selectedOil} ▼</Text>
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.fieldLabel}>الكمية (لتر)</Text>
              <TextInput style={styles.dropdownSelector} keyboardType="numeric" placeholder="أدخل الكمية" value={quantity} onChangeText={setQuantity} />

              <Text style={styles.fieldLabel}>ملاحظات الطلب</Text>
              <TextInput style={[styles.dropdownSelector, { height: 70 }]} multiline value={details} onChangeText={setDetails} />

              <TouchableOpacity style={styles.redButton} onPress={handleSendRequest}>
                <Text style={styles.redButtonText}>إرسال الطلب</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* شاشة التكويد لحساب ميثاق (المدير) ببطاقات الأيقونات */}
        {currentTab === 'coding' && currentUser.role === 'Admin' && (
          <View>
            <Text style={styles.sectionTitleHeader}>شاشة التكويد المركزية</Text>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCodingActiveType('محطات')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>تكويد محطات الوقود</Text>
              <Text style={styles.cardIconEmoji}>⛽</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCodingActiveType('مخصصات')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>تكويد أسماء المخصصات</Text>
              <Text style={styles.cardIconEmoji}>📍</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCodingActiveType('قطع غيار')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>تكويد قطع الغيار</Text>
              <Text style={styles.cardIconEmoji}>🛠️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCodingActiveType('زيوت')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>تكويد أصناف الزيت</Text>
              <Text style={styles.cardIconEmoji}>🛢️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCodingActiveType('بطاريات')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>تكويد البطاريات</Text>
              <Text style={styles.cardIconEmoji}>🔋</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setCodingActiveType('إطارات')}>
              <View style={styles.leftCircleArrow}><Text style={styles.arrowText}>›</Text></View>
              <Text style={styles.cardLabelText}>تكويد الإطارات</Text>
              <Text style={styles.cardIconEmoji}>🛞</Text>
            </TouchableOpacity>

            {codingActiveType && (
              <View style={styles.formBoxCard}>
                <Text style={styles.fieldLabel}>إضافة {codingActiveType} جديد:</Text>
                <TextInput style={styles.dropdownSelector} placeholder="أدخل اسم البند جديد" value={newCodingInput} onChangeText={setNewCodingInput} />
                <TouchableOpacity style={styles.redButton} onPress={handleAddCodingItem}>
                  <Text style={styles.redButtonText}>حفظ في النظام</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* شاشة بيانات السائقين الأيقونة الجديدة */}
        {currentTab === 'drivers' && (
          <View>
            <Text style={styles.sectionTitleHeader}>بيانات السائقين</Text>

            {currentUser.role === 'Admin' && (
              <View style={styles.formBoxCard}>
                <Text style={styles.formTitle}>إضافة سائق جديد</Text>
                <TextInput style={styles.dropdownSelector} placeholder="اسم السائق" value={dName} onChangeText={setDName} />
                <TextInput style={styles.dropdownSelector} placeholder="رقم الهاتف" keyboardType="phone-pad" value={dPhone} onChangeText={setDPhone} />
                <TextInput style={styles.dropdownSelector} placeholder="الوظيفة / الصفة" value={dJob} onChangeText={setDJob} />
                <TextInput style={styles.dropdownSelector} placeholder="رقم السيارة المخصصة" value={dCarNo} onChangeText={setDCarNo} />
                <TouchableOpacity style={styles.redButton} onPress={handleAddDriver}>
                  <Text style={styles.redButtonText}>حفظ السائق</Text>
                </TouchableOpacity>
              </View>
            )}

            {drivers.map((d) => (
              <View key={d.id} style={styles.driverInfoCard}>
                <Text style={styles.driverNameText}>اسم السائق: {d.driverName}</Text>
                <Text style={styles.driverSubText}>رقم التلفون: {d.phone}</Text>
                <Text style={styles.driverSubText}>الوظيفة: {d.jobTitle} | السيارة: {d.carNumber}</Text>
              </View>
            ))}
          </View>
        )}

        {/* شاشة بيانات السيارات */}
        {currentTab === 'cars' && (
          <View>
            <Text style={styles.sectionTitleHeader}>أسطول السيارات</Text>
            {cars.map((c) => (
              <View key={c.carNumber} style={styles.driverInfoCard}>
                <Text style={styles.driverNameText}>{c.carName}</Text>
                <Text style={styles.driverSubText}>رقم السيارة: {c.carNumber} | السائق: {c.driverName}</Text>
                <Text style={styles.driverSubText}>الموديل: {c.model} | الوقود: {c.fuelType}</Text>
              </View>
            ))}
          </View>
        )}

        {/* التقارير والإستعلام */}
        {currentTab === 'reports' && (
          <View>
            <Text style={styles.sectionTitleHeader}>التقارير والإستعلام</Text>
            {requests.map((r) => (
              <View key={r.id} style={styles.driverInfoCard}>
                <Text style={styles.driverNameText}>السيارة: {r.carNumber} ({r.driverName})</Text>
                <Text style={styles.driverSubText}>النوع: {r.type} | التاريخ: {r.dateTime}</Text>
                <Text style={styles.driverSubText}>الكمية: {r.quantityLiters} لتر | المبلغ: {r.totalCost} ريال</Text>
                <Text style={styles.driverSubText}>الحالة: {r.status}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* الشريط السفلي للتنقل بنفس مظهر الصور */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('home')}>
          <Text style={[styles.navIcon, currentTab === 'home' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navText, currentTab === 'home' && styles.navTextActive]}>الرئيسية</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('reports')}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>التقارير</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentUser(null)}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navText}>الإعدادات</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة القوائم المنسدلة Modal */}
      <Modal visible={pickerModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>اختر من القائمة</Text>
            <ScrollView>
              {pickerItems.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.modalItemBtn}
                  onPress={() => {
                    onSelectPicker(item);
                    setPickerModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setPickerModalVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  authContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  appHeaderTitle: { fontSize: 24, fontWeight: 'bold', color: '#c62828', textAlign: 'center', marginBottom: 20 },
  cardBox: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 3 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  customInput: { backgroundColor: '#f1f3f5', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12, textAlign: 'right' },
  redButton: { backgroundColor: '#d32f2f', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  redButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  topHeader: { height: 55, backgroundColor: '#fff', flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 20, color: '#000' },
  headerTitleText: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#000' },
  
  mainContent: { flex: 1, padding: 15 },
  welcomeCard: { backgroundColor: '#f1f3f5', borderRadius: 15, padding: 15, marginBottom: 15, alignItems: 'flex-end' },
  welcomeSub: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold' },
  welcomeName: { color: '#212529', fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  
  actionCard: { backgroundColor: '#e9ecef', borderRadius: 15, paddingVertical: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  leftCircleArrow: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#d32f2f', justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: '#d32f2f', fontSize: 18, fontWeight: 'bold', marginTop: -2 },
  cardLabelText: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
  cardIconEmoji: { fontSize: 22 },

  topTabsRow: { flexDirection: 'row-reverse', marginBottom: 15 },
  subTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ccc' },
  subTabActive: { borderBottomColor: '#d32f2f' },
  subTabText: { color: '#666', fontWeight: 'bold' },
  subTabTextActive: { color: '#d32f2f' },

  formBoxCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, elevation: 2, marginBottom: 15 },
  fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#495057', marginTop: 10, marginBottom: 5, textAlign: 'right' },
  dropdownSelector: { backgroundColor: '#f1f3f5', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ced4da', marginBottom: 5, alignItems: 'flex-end' },
  dropdownText: { fontSize: 14, color: '#212529', fontWeight: 'bold' },

  sectionTitleHeader: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 15, textAlign: 'right' },
  driverInfoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, elevation: 1 },
  driverNameText: { fontSize: 15, fontWeight: 'bold', color: '#d32f2f', textAlign: 'right' },
  driverSubText: { fontSize: 13, color: '#495057', textAlign: 'right', marginTop: 2 },

  bottomNavBar: { height: 60, backgroundColor: '#fff', flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 18, color: '#666' },
  navIconActive: { color: '#d32f2f' },
  navText: { fontSize: 11, color: '#666', marginTop: 2 },
  navTextActive: { color: '#d32f2f', fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalItemBtn: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  modalItemText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  closeModalBtn: { backgroundColor: '#d32f2f', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 15 }
});

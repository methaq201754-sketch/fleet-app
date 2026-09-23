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
  Image,
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
  chassisNumber?: string;
  engineNumber?: string;
  lastOdometer: number;
}

interface User {
  username: string;
  password: string;
  role: Role;
  carNumber: string;
  driverName: string;
}

interface PriceConfig {
  fuelPricePerLiter: number;
  oilPricePerLiter: number;
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
  
  maintenanceReason?: string;
  sparePartName?: string;
  
  totalCost: number;
  details?: string;
  imageUri?: string;
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
  { username: 'ميثاق', password: '111', role: 'Admin', carNumber: 'إدارة', driverName: 'ميثاق (المدير)' },
  ...INITIAL_CARS.map((c) => ({
    username: c.carNumber,
    password: '000',
    role: 'Driver' as Role,
    carNumber: c.carNumber,
    driverName: c.driverName,
  })),
];

const DEFAULT_STATIONS = ['محطة الزبيدي', 'محطة الشركة', 'محطة نقدي'];
const DEFAULT_OILS = ['تويوتا', 'ليوكي مولي', 'ناشيونال'];
const DEFAULT_REGIONS = ['تعز', 'صنعاء', 'عدن', 'الحديدة', 'إب', 'مأرب', 'حضرموت', 'ذمار', 'شهري'];

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [cars, setCars] = useState<CarData[]>(INITIAL_CARS);
  const [prices, setPrices] = useState<PriceConfig>({ fuelPricePerLiter: 950, oilPricePerLiter: 3500 });
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [stations, setStations] = useState<string[]>(DEFAULT_STATIONS);
  const [oilTypes, setOilTypes] = useState<string[]>(DEFAULT_OILS);
  const [regions, setRegions] = useState<string[]>(DEFAULT_REGIONS);

  const [currentTab, setCurrentTab] = useState<'requests' | 'reports' | 'car_list' | 'add_car' | 'coding' | 'admin_panel'>('requests');
  const [selectedReqType, setSelectedReqType] = useState<RequestType>('محروقات');

  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelQuantity, setFuelQuantity] = useState('');
  const [selectedStation, setSelectedStation] = useState(DEFAULT_STATIONS[0]);
  const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGIONS[0]);
  
  const [selectedOil, setSelectedOil] = useState(DEFAULT_OILS[0]);
  const [oilQuantity, setOilQuantity] = useState('');
  const [oilPrice, setOilPrice] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState('');
  
  const [reqDetails, setReqDetails] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [estimatedCostInput, setEstimatedCostInput] = useState('');

  const [newCarNo, setNewCarNo] = useState('');
  const [newCarName, setNewCarName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newModel, setNewModel] = useState('');

  const [newStationInput, setNewStationInput] = useState('');

  const [reportTab, setReportTab] = useState<RequestType>('محروقات');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('@fleet_users_v2');
      const storedCars = await AsyncStorage.getItem('@fleet_cars_v2');
      const storedReqs = await AsyncStorage.getItem('@fleet_reqs_v2');

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedCars) setCars(JSON.parse(storedCars));
      if (storedReqs) setRequests(JSON.parse(storedReqs));
    } catch (e) {
      console.error(e);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('@fleet_users_v2', JSON.stringify(users));
      await AsyncStorage.setItem('@fleet_cars_v2', JSON.stringify(cars));
      await AsyncStorage.setItem('@fleet_reqs_v2', JSON.stringify(requests));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = () => {
    const user = users.find(
      (u) => u.username.trim() === loginUsername.trim() && u.password.trim() === loginPassword.trim()
    );

    if (user) {
      setCurrentUser(user);
      setLoginUsername('');
      setLoginPassword('');
      if (user.role === 'Admin') setCurrentTab('admin_panel');
      else setCurrentTab('requests');
    } else {
      Alert.alert('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setAttachmentUri(result.assets[0].uri);
    }
  };

  const getCurrentCar = () => cars.find((c) => c.carNumber === currentUser?.carNumber);
  const previousOdometerValue = getCurrentCar()?.lastOdometer || 0;

  const handleSendRequest = () => {
    if (!currentUser) return;

    let total = 0;
    let unitP = 0;
    let qty = 0;
    let prevOdo = previousOdometerValue;
    let currOdo = parseFloat(currentOdometer) || 0;
    let distance = 0;

    if (selectedReqType === 'محروقات') {
      qty = parseFloat(fuelQuantity) || 0;
      unitP = prices.fuelPricePerLiter;
      total = qty * unitP;
    } else if (selectedReqType === 'زيوت') {
      qty = parseFloat(oilQuantity) || 0;
      unitP = parseFloat(oilPrice) || prices.oilPricePerLiter;
      total = qty * unitP;
      if (currOdo > prevOdo) {
        distance = currOdo - prevOdo;
      }
    } else {
      total = parseFloat(estimatedCostInput) || 0;
    }

    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      driverUsername: currentUser.username,
      driverName: currentUser.driverName,
      carNumber: currentUser.carNumber,
      type: selectedReqType,
      dateTime: requestDate,
      quantityLiters: qty,
      unitPrice: unitP,
      stationName: selectedStation,
      allocationRegion: selectedRegion,
      oilType: selectedOil,
      previousOdometer: prevOdo,
      currentOdometer: currOdo,
      distanceTraveled: distance,
      totalCost: total,
      details: reqDetails,
      imageUri: attachmentUri || undefined,
      status: 'قيد الانتظار',
    };

    const updatedReqs = [newReq, ...requests];
    setRequests(updatedReqs);

    if (currOdo > prevOdo) {
      const updatedCars = cars.map((c) =>
        c.carNumber === currentUser.carNumber ? { ...c, lastOdometer: currOdo } : c
      );
      setCars(updatedCars);
    }

    saveData();
    Alert.alert('تم بنجاح', 'تم إرسال الطلب بنجاح للإدارة.');
    setFuelQuantity('');
    setCurrentOdometer('');
    setReqDetails('');
    setAttachmentUri(null);
  };

  const handleAddCar = () => {
    if (!newCarNo.trim() || !newCarName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم السيارة واسمها');
      return;
    }

    const newCarItem: CarData = {
      carNumber: newCarNo.trim(),
      carName: newCarName.trim(),
      driverName: newDriverName.trim() || 'غير محدد',
      model: newModel.trim() || '2020',
      fuelType: 'ديزل',
      transportType: 'ثقيل',
      lastOdometer: 0,
    };

    const newUserItem: User = {
      username: newCarNo.trim(),
      password: '000',
      role: 'Driver',
      carNumber: newCarNo.trim(),
      driverName: newDriverName.trim() || 'غير محدد',
    };

    setCars([...cars, newCarItem]);
    setUsers([...users, newUserItem]);
    saveData();
    Alert.alert('تم', 'تم إضافة السيارة والسائق بنجاح.');
    setNewCarNo('');
    setNewCarName('');
    setNewDriverName('');
  };

  const filteredRequests = requests.filter((r) => {
    if (r.type !== reportTab) return false;
    if (currentUser?.role === 'Driver' && r.carNumber !== currentUser.carNumber) return false;
    if (fromDate && r.dateTime < fromDate) return false;
    if (toDate && r.dateTime > toDate) return false;
    return true;
  });

  const totalQuantityReport = filteredRequests.reduce((sum, r) => sum + (r.quantityLiters || 0), 0);
  const totalCostReport = filteredRequests.reduce((sum, r) => sum + r.totalCost, 0);

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authBox}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>YCPD</Text>
              <View style={styles.logoSmile} />
              <Text style={styles.logoAtlasText}>أطلس</Text>
            </View>

            <Text style={styles.appTitle}>نظام إدارة السيارات والأسطول</Text>
            <Text style={styles.appSubTitle}>شركة YCPD - أطلس</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>رقم السيارة (اسم المستخدم):</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل رقم السيارة (مثال: 22618)"
                value={loginUsername}
                onChangeText={setLoginUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور (افتراضي 000):</Text>
              <TextInput
                style={styles.input}
                placeholder="****"
                secureTextEntry
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
              <Text style={styles.btnText}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topInfoBar}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>السيارة:</Text>
          <Text style={styles.infoValue}>{currentUser.carNumber}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>المستخدم / السائق:</Text>
          <Text style={styles.infoValue}>{currentUser.driverName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutChip} onPress={() => setCurrentUser(null)}>
          <Text style={styles.logoutChipText}>خروج</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal style={styles.tabBar} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={[styles.tabItem, currentTab === 'requests' && styles.activeTabItem]} onPress={() => setCurrentTab('requests')}>
          <Text style={styles.tabText}>طلب خدمة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, currentTab === 'reports' && styles.activeTabItem]} onPress={() => setCurrentTab('reports')}>
          <Text style={styles.tabText}>التقارير والإستعلام</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, currentTab === 'car_list' && styles.activeTabItem]} onPress={() => setCurrentTab('car_list')}>
          <Text style={styles.tabText}>بيانات السيارات</Text>
        </TouchableOpacity>

        {currentUser.role === 'Admin' && (
          <>
            <TouchableOpacity style={[styles.tabItem, currentTab === 'add_car' && styles.activeTabItem]} onPress={() => setCurrentTab('add_car')}>
              <Text style={styles.tabText}>إدخال بيانات سيارة</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, currentTab === 'coding' && styles.activeTabItem]} onPress={() => setCurrentTab('coding')}>
              <Text style={styles.tabText}>شاشة التكويد</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, currentTab === 'admin_panel' && styles.activeTabItem]} onPress={() => setCurrentTab('admin_panel')}>
              <Text style={styles.tabText}>لوحة الإدارة</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <ScrollView style={styles.content}>
        {currentTab === 'requests' && (
          <View>
            <Text style={styles.sectionHeader}>تقديم طلب جديد</Text>
            <View style={styles.typeSelector}>
              {(['محروقات', 'زيوت', 'قطع غيار', 'صيانة', 'تائرات'] as RequestType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, selectedReqType === t && styles.activeTypeBtn]}
                  onPress={() => setSelectedReqType(t)}
                >
                  <Text style={[styles.typeBtnText, selectedReqType === t && styles.activeTypeBtnText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>التاريخ:</Text>
                <TextInput style={styles.input} value={requestDate} onChangeText={setRequestDate} />
              </View>

              {selectedReqType === 'محروقات' && (
                <>
                  <Text style={styles.priceNotice}>سعر اللتر المعتمد: {prices.fuelPricePerLiter} ريال</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>الكمية باللتر:</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="أدخل الكمية"
                      value={fuelQuantity}
                      onChangeText={setFuelQuantity}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>اختر المحطة:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {stations.map((st) => (
                        <TouchableOpacity key={st} style={[styles.chipBtn, selectedStation === st && styles.chipBtnActive]} onPress={() => setSelectedStation(st)}>
                          <Text style={selectedStation === st ? styles.chipTextActive : styles.chipText}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>منطقة المخصص:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {regions.map((rg) => (
                        <TouchableOpacity key={rg} style={[styles.chipBtn, selectedRegion === rg && styles.chipBtnActive]} onPress={() => setSelectedRegion(rg)}>
                          <Text style={selectedRegion === rg ? styles.chipTextActive : styles.chipText}>{rg}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={styles.calcTotalText}>
                    الإجمالي: {((parseFloat(fuelQuantity) || 0) * prices.fuelPricePerLiter).toLocaleString()} ريال
                  </Text>
                </>
              )}

              {selectedReqType === 'زيوت' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>نوع الزيت:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {oilTypes.map((ot) => (
                        <TouchableOpacity key={ot} style={[styles.chipBtn, selectedOil === ot && styles.chipBtnActive]} onPress={() => setSelectedOil(ot)}>
                          <Text style={selectedOil === ot ? styles.chipTextActive : styles.chipText}>{ot}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>الكمية:</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="عدد ألتار الزيت" value={oilQuantity} onChangeText={setOilQuantity} />
                  </View>

                  <View style={styles.odoBox}>
                    <Text style={styles.label}>العداد السابق (تلقائي): {previousOdometerValue} كم</Text>
                    <Text style={styles.label}>العداد الحالي:</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="قراءة العداد الحالية" value={currentOdometer} onChangeText={setCurrentOdometer} />
                    <Text style={styles.calcTotalText}>
                      المسافة المقطوعة: {Math.max(0, (parseFloat(currentOdometer) || 0) - previousOdometerValue)} كم
                    </Text>
                  </View>
                </>
              )}

              {(selectedReqType === 'قطع غيار' || selectedReqType === 'صيانة' || selectedReqType === 'تائرات') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>التكلفة التقديرية (ريال):</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholder="التكلفة بالريال" value={estimatedCostInput} onChangeText={setEstimatedCostInput} />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>تفاصيل وملاحظات:</Text>
                <TextInput style={[styles.input, { height: 60 }]} multiline placeholder="ملاحظات..." value={reqDetails} onChangeText={setReqDetails} />
              </View>

              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Text style={styles.attachBtnText}>{attachmentUri ? '✔️ تم إرفاق الصورة' : '📷 إرفاق صورة الفاتورة / المرفق'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnPrimary} onPress={handleSendRequest}>
                <Text style={styles.btnText}>إرسال الطلب</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'reports' && (
          <View>
            <Text style={styles.sectionHeader}>التقارير والإستعلام</Text>

            <ScrollView horizontal style={styles.tabBar} showsHorizontalScrollIndicator={false}>
              {(['محروقات', 'زيوت', 'صيانة', 'قطع غيار', 'تائرات'] as RequestType[]).map((t) => (
                <TouchableOpacity key={t} style={[styles.typeBtn, reportTab === t && styles.activeTypeBtn]} onPress={() => setReportTab(t)}>
                  <Text style={[styles.typeBtnText, reportTab === t && styles.activeTypeBtnText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.formCard}>
              <Text style={styles.label}>الفترة الزمنية للاستعلام:</Text>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="من YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} />
                <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="إلى YYYY-MM-DD" value={toDate} onChangeText={setToDate} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>إجمالي المسحوب</Text>
                  <Text style={styles.statVal}>{totalQuantityReport.toLocaleString()}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>إجمالي التكلفة</Text>
                  <Text style={[styles.statVal, { color: '#2e7d32' }]}>{totalCostReport.toLocaleString()} ر.ي</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeader}>السجل التفصيلي</Text>
            {filteredRequests.map((r) => (
              <View key={r.id} style={styles.reqCard}>
                <Text style={styles.cardTitle}>السيارة: {r.carNumber} | السائق: {r.driverName}</Text>
                <Text style={styles.reqDetail}>التاريخ: {r.dateTime} | النوع: {r.type}</Text>
                {r.type === 'محروقات' && <Text style={styles.reqDetail}>الكمية: {r.quantityLiters} لتر | المحطة: {r.stationName} | المخصص: {r.allocationRegion}</Text>}
                {r.type === 'زيوت' && <Text style={styles.reqDetail}>نوع الزيت: {r.oilType} | المسافة المقطوعة: {r.distanceTraveled} كم</Text>}
                <Text style={styles.reqDetail}>المبلغ: {r.totalCost.toLocaleString()} ريال | الحالة: {r.status}</Text>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'car_list' && (
          <View>
            <Text style={styles.sectionHeader}>بيانات جميع سيارات الأسطول</Text>
            {cars.map((c) => (
              <View key={c.carNumber} style={styles.reqCard}>
                <Text style={styles.cardTitle}>{c.carName}</Text>
                <Text style={styles.reqDetail}>رقم السيارة: {c.carNumber} | السائق: {c.driverName}</Text>
                <Text style={styles.reqDetail}>الموديل: {c.model} | الوقود: {c.fuelType} | نوع النقل: {c.transportType}</Text>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'add_car' && currentUser.role === 'Admin' && (
          <View style={styles.formCard}>
            <Text style={styles.sectionHeader}>إدخال بيانات سيارة جديدة</Text>
            <TextInput style={styles.input} placeholder="رقم السيارة" value={newCarNo} onChangeText={setNewCarNo} />
            <TextInput style={styles.input} placeholder="اسم السيارة ووصفها" value={newCarName} onChangeText={setNewCarName} />
            <TextInput style={styles.input} placeholder="اسم السائق" value={newDriverName} onChangeText={setNewDriverName} />
            <TextInput style={styles.input} placeholder="الموديل (مثال: 2020)" value={newModel} onChangeText={setNewModel} />
            <TouchableOpacity style={styles.btnPrimary} onPress={handleAddCar}>
              <Text style={styles.btnText}>حفظ السيارة في النظام</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentTab === 'coding' && currentUser.role === 'Admin' && (
          <View style={styles.formCard}>
            <Text style={styles.sectionHeader}>شاشة التكويد وإدارة الثوابت</Text>
            <Text style={styles.label}>تكويد محطات الوقود:</Text>
            <View style={{ flexDirection: 'row-reverse' }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="اسم المحطة الجديد" value={newStationInput} onChangeText={setNewStationInput} />
              <TouchableOpacity
                style={styles.addSmallBtn}
                onPress={() => {
                  if (newStationInput) {
                    setStations([...stations, newStationInput]);
                    setNewStationInput('');
                    saveData();
                  }
                }}
              >
                <Text style={styles.btnText}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'admin_panel' && currentUser.role === 'Admin' && (
          <View>
            <Text style={styles.sectionHeader}>طلبات الخدمات الواردة للاعتماد</Text>
            {requests.map((r) => (
              <View key={r.id} style={styles.reqCard}>
                <Text style={styles.cardTitle}>السائق: {r.driverName} ({r.carNumber})</Text>
                <Text style={styles.reqDetail}>نوع الطلب: {r.type} | التاريخ: {r.dateTime}</Text>
                <Text style={styles.reqDetail}>إجمالي المبلغ: {r.totalCost.toLocaleString()} ريال</Text>
                <Text style={styles.reqDetail}>الحالة: {r.status}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: '#2e7d32' }]}
                    onPress={() => {
                      setRequests(requests.map((item) => (item.id === r.id ? { ...item, status: 'تمت الموافقة' } : item)));
                      saveData();
                    }}
                  >
                    <Text style={styles.btnText}>موافقة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: '#c62828' }]}
                    onPress={() => {
                      setRequests(requests.map((item) => (item.id === r.id ? { ...item, status: 'مرفوض' } : item)));
                      saveData();
                    }}
                  >
                    <Text style={styles.btnText}>رفض</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  authScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  authBox: { backgroundColor: '#ffffff', borderRadius: 15, padding: 20, elevation: 4, alignItems: 'center' },
  logoBadge: { backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center', borderWidth: 2, borderColor: '#000', marginBottom: 15 },
  logoBadgeText: { fontWeight: 'bold', fontSize: 18, color: '#000' },
  logoSmile: { width: 35, height: 10, borderBottomWidth: 4, borderBottomColor: '#d32f2f', borderRadius: 10 },
  logoAtlasText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  appTitle: { fontSize: 20, fontWeight: 'bold', color: '#0d47a1', marginTop: 10 },
  appSubTitle: { fontSize: 13, color: '#666', marginBottom: 20 },
  inputGroup: { width: '100%', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 4, textAlign: 'right' },
  input: { backgroundColor: '#f0f4f8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, textAlign: 'right', borderWidth: 1, borderColor: '#ccc', marginBottom: 6 },
  btnPrimary: { backgroundColor: '#1565c0', borderRadius: 8, paddingVertical: 12, width: '100%', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  topInfoBar: { backgroundColor: '#0d47a1', padding: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { alignItems: 'flex-start' },
  infoLabel: { color: '#bbdefb', fontSize: 11 },
  infoValue: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  logoutChip: { backgroundColor: '#c62828', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  logoutChipText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row-reverse', backgroundColor: '#fff', elevation: 2, paddingVertical: 5 },
  tabItem: { paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: '#1565c0' },
  tabText: { fontWeight: 'bold', color: '#333', fontSize: 13 },
  content: { flex: 1, padding: 12 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#0d47a1', marginVertical: 8, textAlign: 'right' },
  typeSelector: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
  typeBtn: { flex: 1, backgroundColor: '#e0e0e0', paddingVertical: 6, marginHorizontal: 2, borderRadius: 6, alignItems: 'center' },
  activeTypeBtn: { backgroundColor: '#1565c0' },
  typeBtnText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  activeTypeBtnText: { color: '#fff' },
  formCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, elevation: 2, marginBottom: 15 },
  priceNotice: { color: '#d32f2f', fontWeight: 'bold', marginBottom: 8, textAlign: 'right', fontSize: 12 },
  calcTotalText: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginVertical: 6, textAlign: 'right' },
  chipBtn: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 6, marginBottom: 6 },
  chipBtnActive: { backgroundColor: '#1565c0' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextActive: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  odoBox: { backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8, marginVertical: 8 },
  attachBtn: { backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8, alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#90caf9' },
  attachBtnText: { color: '#1565c0', fontWeight: 'bold', fontSize: 13 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10 },
  statBox: { flex: 0.48, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, alignItems: 'center' },
  statTitle: { fontSize: 11, color: '#666' },
  statVal: { fontSize: 16, fontWeight: 'bold', color: '#0d47a1', marginTop: 2 },
  reqCard: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8, elevation: 2 },
  cardTitle: { fontWeight: 'bold', fontSize: 14, textAlign: 'right', marginBottom: 4, color: '#0d47a1' },
  reqDetail: { textAlign: 'right', color: '#444', marginBottom: 2, fontSize: 12 },
  addSmallBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 15, justifyContent: 'center', borderRadius: 8, marginRight: 5 },
  actionRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 8 },
  smallBtn: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 6 },
});

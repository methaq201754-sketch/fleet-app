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
  Switch,
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
  type?: string;
  capacity?: string;
  transportType?: string;
  model?: string;
  passengers?: string;
  fuelType?: string;
  status: 'في الخدمة' | 'موقف';
}

interface Driver {
  id: string;
  name: string;
  phone?: string;
  licenseNumber?: string;
  assignedVehiclePlate?: string;
}

interface VehicleAssignment {
  id: string;
  vehiclePlate: string;
  driverName: string;
  fromDate: string;
  toDate: string;
}

interface ItemPrice {
  item: string;
  price: string;
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
  const [codingSubTab, setCodingSubTab] = useState<keyof CodeCategories | 'prices'>('stations');
  const [dashboardSubTab, setDashboardSubTab] = useState<string>('vehicles_list');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('لم تتم المزامنة بعد');

  // القائمة الكاملة للسيارات المدخلة
  const initialVehicles: Vehicle[] = [
    { id: 'v22618', plateNumber: '22618', name: 'قاطرة فولفو 2002رقم 22618', driverName: 'عبد الغني علي دحان', status: 'في الخدمة' },
    { id: 'v36040', plateNumber: '36040', name: 'شاحنة فولفو2013 رقم 36040', driverName: 'امين الســـيد', status: 'في الخدمة' },
    { id: 'v28336', plateNumber: '28336', name: 'متسوبيشي فوزو 2012رقم 28336', driverName: 'عماد علي دحان', status: 'في الخدمة' },
    { id: 'v31538', plateNumber: '31538', name: 'ايسوزو2016 رقم 31538', driverName: 'جميل قائد', status: 'في الخدمة' },
    { id: 'v29971', plateNumber: '29971', name: 'ايسوزو 2012رقم 29971', driverName: 'يزيدعبدالواسع', status: 'في الخدمة' },
    { id: 'v34552', plateNumber: '34552', name: 'ايسوزو 2015 رقم 34552', driverName: 'حافظ النيني', status: 'في الخدمة' },
    { id: 'v33230', plateNumber: '33230', name: 'بابور اسيوزا2016 رقم  33230', driverName: 'عبده محمد ناجي', status: 'في الخدمة' },
    { id: 'v34208', plateNumber: '34208', name: 'ايسوزو2020 رقم 34208', driverName: 'فهد سعيد سيف', status: 'في الخدمة' },
    { id: 'v28807', plateNumber: '28807', name: 'دينا متسوبيشي2012 رقم 28807', driverName: 'خالد عثمان', status: 'في الخدمة' },
    { id: 'v29485', plateNumber: '29485', name: 'دينا متسوبيشي2013 رقم 29485', driverName: 'درهم علي عبده', status: 'في الخدمة' },
    { id: 'v30646', plateNumber: '30646', name: 'دينا متسوبيشي 2014رقم 30646', driverName: 'محمدالنيني', status: 'في الخدمة' },
    { id: 'v36697', plateNumber: '36697', name: 'دينا متسوبيشي2013 رقم 36697', driverName: 'حمود سرحان', status: 'في الخدمة' },
    { id: 'v24122', plateNumber: '24122', name: 'قاطره مرسديس 2005رقم 24122', driverName: 'غير محدد', status: 'في الخدمة' },
    { id: 'v34451', plateNumber: '34451', name: 'باص كوستر 2012', driverName: 'عدنان علي عبدالله', status: 'في الخدمة' },
    { id: 'v23317', plateNumber: '23317', name: 'دايهاتسو قلاب موديل 2004', driverName: 'محمدمحسن', status: 'في الخدمة' },
    { id: 'v28185', plateNumber: '28185', name: 'دينا متسوبيشي2010', driverName: 'سامي عبدالنور', status: 'في الخدمة' },
    { id: 'v31457', plateNumber: '31457', name: 'لاندكروزر صالون2012', driverName: 'رشاد عبدالحميد', status: 'في الخدمة' },
    { id: 'v46383', plateNumber: '46383', name: 'رافور تويوتا 2020', driverName: 'امجد لطفي عبد الحميد', status: 'في الخدمة' },
    { id: 'v29732', plateNumber: '29732', name: 'لاندكروزر صالون2011', driverName: 'عامرمحمد علي نعمان', status: 'في الخدمة' },
    { id: 'v139614', plateNumber: '139614', name: 'رافور تويوتا 2020', driverName: 'وسيم عامر محمد علي', status: 'في الخدمة' },
    { id: 'v161777', plateNumber: '161777', name: 'تويوتا رافور 2021', driverName: 'احمد لطفي عبد الحميد', status: 'في الخدمة' },
    { id: 'v53665', plateNumber: '53665', name: 'جيب2014', driverName: 'وهيب عبدالحميد', status: 'في الخدمة' },
    { id: 'v135753', plateNumber: '135753', name: 'رافور تويوتا 2014', driverName: 'حمدي شريف', status: 'في الخدمة' },
    { id: 'v27750', plateNumber: '27750', name: 'فرتشنار تويوتا 2010', driverName: 'لطفي سعيد علي', status: 'في الخدمة' },
    { id: 'v30551', plateNumber: '30551', name: 'فرتشنار تويوتا 2014', driverName: 'عبدالله الوردي', status: 'في الخدمة' },
    { id: 'v29015', plateNumber: '29015', name: 'هيلوكس غمارة 2010', driverName: 'ماجد عبده فارع', status: 'في الخدمة' },
    { id: 'v13287', plateNumber: '13287', name: 'هيلوكس غمارتين ديزل 2014', driverName: 'مروان الفقية', status: 'في الخدمة' },
    { id: 'v44972', plateNumber: '44972', name: 'سوزكي جيمني 2015', driverName: 'صابر جواد', status: 'في الخدمة' },
    { id: 'v25749', plateNumber: '25749', name: 'هيلوكس غماره  2013', driverName: 'المعرض', status: 'في الخدمة' },
    { id: 'v26519', plateNumber: '26519', name: 'هليوكس غمارتين2008', driverName: 'محمد الشيباني', status: 'في الخدمة' },
    { id: 'v20040', plateNumber: '20040', name: 'هواندي توسان2012', driverName: 'محمدالنعماني', status: 'في الخدمة' },
    { id: 'v45551', plateNumber: '45551', name: 'زوكي جمني2013', driverName: 'معاذ النيني', status: 'في الخدمة' },
    { id: 'v19404', plateNumber: '19404', name: 'باص كوستر 2004', driverName: 'سلمان احمد عبدالله', status: 'في الخدمة' },
    { id: 'v46166', plateNumber: '46166', name: 'دايهاتسو-تريوس', driverName: 'رمزي عبدالجليل', status: 'في الخدمة' },
    { id: 'v15808', plateNumber: '15808', name: 'تويوتا برادو2000', driverName: 'الخدمات', status: 'في الخدمة' },
    { id: 'v34189', plateNumber: '34189', name: 'هواندي توسان 2014', driverName: 'توحيد احمد حيدر', status: 'في الخدمة' },
    { id: 'v46379', plateNumber: '46379', name: 'فوشنار 2015', driverName: 'عبدالفتاح درهم', status: 'في الخدمة' },
    { id: 'v43166', plateNumber: '43166', name: 'دايهاتسو تريوس 2013', driverName: 'هاني فيصل', status: 'في الخدمة' },
    { id: 'v46140', plateNumber: '46140', name: 'باص كوستر  2012 جديد  بدون رقم', driverName: 'عبدالاله محمد احمد', status: 'في الخدمة' },
    { id: 'v27949', plateNumber: '27949', name: 'دايهاتسو طويل2010رقم27949', driverName: 'وحيد عبدالله سعيد', status: 'في الخدمة' },
    { id: 'v54446', plateNumber: '54446', name: 'هونداي توسان 2020', driverName: 'محمد صادق سليمان', status: 'في الخدمة' },
    { id: 'v54825', plateNumber: '54825', name: 'هونداي توسان 2020', driverName: 'اشرف عبد القادر', status: 'في الخدمة' },
    { id: 'v43661', plateNumber: '43661', name: 'دايهاتسو تريوس 2015', driverName: 'سالم باوزير', status: 'في الخدمة' },
    { id: 'v16501', plateNumber: '16501', name: 'هيلوكس غماره 2014', driverName: 'محمد سمير', status: 'في الخدمة' },
    { id: 'v43667', plateNumber: '43667', name: 'دايهاتسو تريوس2014', driverName: 'وسيم عبدالسلام', status: 'في الخدمة' },
    { id: 'v43998', plateNumber: '43998', name: 'تويوتا هيلوكس غمارتين دبل 2021', driverName: 'عبدالرقيب عبدالوهاب', status: 'في الخدمة' },
    { id: 'v49039', plateNumber: '49039', name: 'تويوتا فور تشنر 2013', driverName: 'خالدالشراعي', status: 'في الخدمة' },
    { id: 'v56989', plateNumber: '56989', name: 'تويوتا فور تشنر 2015', driverName: 'نبيل الشوافي', status: 'في الخدمة' },
    { id: 'v6', plateNumber: '6', name: 'ميثاق', driverName: 'غير محدد', status: 'في الخدمة' },
    { id: 'v8_1', plateNumber: '8-1', name: 'كيا برايد2009', driverName: 'سمير عبدالمولى', status: 'في الخدمة' },
    { id: 'v8_2', plateNumber: '8-2', name: 'سنتافي 2007', driverName: 'مصطفى المخلافي', status: 'في الخدمة' },
    { id: 'v8_3', plateNumber: '8-3', name: 'الرفاعة CAT المخازن الخام', driverName: 'مخازن نقيل الابل', status: 'في الخدمة' },
    { id: 'v8_4', plateNumber: '8-4', name: 'الرفاعة CAT  المخزن التام ( مرتضى )', driverName: 'المخزن التام', status: 'في الخدمة' },
    { id: 'v8_5', plateNumber: '8-5', name: 'الرفاعة CAT الانتاج', driverName: 'الانتاج', status: 'في الخدمة' },
    { id: 'v8_6', plateNumber: '8-6', name: 'الرفاعة الهندي المخازن الخام', driverName: 'المشتريات نقيل لابل', status: 'في الخدمة' },
    { id: 'v8_7', plateNumber: 'رفاعة-4', name: 'الرفاعة TCM المخازن الخام والانتاج', driverName: 'نقبل الابل', status: 'في الخدمة' },
    { id: 'v38079', plateNumber: '38079', name: 'توسان 2006', driverName: 'اروي محمد مسعد', status: 'في الخدمة' },
    { id: 'v45881', plateNumber: '45881', name: 'رافور 2006', driverName: 'بسام عبدالكريم', status: 'في الخدمة' },
    { id: 'v45880', plateNumber: '45880', name: 'رافور2011', driverName: 'صفوان قايد', status: 'في الخدمة' },
    { id: 'v36282', plateNumber: '36282', name: 'تويوتا برادو 2006', driverName: 'جميل ناجي', status: 'في الخدمة' },
    { id: 'v_riyadh', plateNumber: 'رياض', name: 'تويوتا رافور2010', driverName: 'رياض القباطي', status: 'في الخدمة' },
    { id: 'v43472', plateNumber: '43472', name: 'كيا سول', driverName: 'مدحت شريف', status: 'في الخدمة' },
    { id: 'v_verna', plateNumber: 'فيرنا', name: 'هواندي فيرنا2008', driverName: 'مراد الشوافي', status: 'في الخدمة' },
    { id: 'v31036', plateNumber: '31036', name: 'هونداي توسان2012', driverName: 'مراد المقطري', status: 'في الخدمة' },
    { id: 'v46378', plateNumber: '46378', name: 'رافور 2007', driverName: 'اديب سعيد', status: 'في الخدمة' },
    { id: 'v46062', plateNumber: '46062', name: 'هواندي توسان2005', driverName: 'سعيد محمداحمد', status: 'في الخدمة' },
    { id: 'v32631', plateNumber: '32631', name: 'رافور2007', driverName: 'انس احمد محمد', status: 'في الخدمة' },
    { id: 'v8615', plateNumber: '8615', name: 'هايلكس 1998', driverName: 'جلال شائف', status: 'في الخدمة' },
    { id: 'v135835', plateNumber: '135835', name: 'سوزوك ي سويفت ديزايز 2013', driverName: 'فرع صنعاء', status: 'في الخدمة' },
    { id: 'v122649', plateNumber: '122649', name: 'هونداي توسان 2014', driverName: 'فرع صنعاء', status: 'في الخدمة' },
    { id: 'v23230', plateNumber: '23230', name: 'هايلكس 2003', driverName: 'تلال', status: 'في الخدمة' },
    { id: 'v34991', plateNumber: '34991', name: 'هايلكس غمارتين 1998', driverName: 'غير محدد', status: 'في الخدمة' },
    { id: 'v24893', plateNumber: '24893', name: 'سوزوكي 1994', driverName: 'سعيد هزاع', status: 'في الخدمة' },
    { id: 'v27509', plateNumber: '27509', name: 'هيلوكس غماره 2014', driverName: 'فرع الحديدة', status: 'في الخدمة' },
    { id: 'v8204', plateNumber: '8204', name: 'هيلكس 1993', driverName: 'سعيد عبد المجيد', status: 'في الخدمة' },
    { id: 'v5787', plateNumber: '5787', name: 'كرسيدا 1993', driverName: 'وليد محمد علي', status: 'في الخدمة' },
    { id: 'v10433', plateNumber: '10433', name: 'هيلكس 1985', driverName: 'مراد عبد الله', status: 'في الخدمة' },
    { id: 'v36697_m', plateNumber: '36697-م', name: 'متسوبيشي فوزوا كانتر', driverName: 'فرع المكلا', status: 'في الخدمة' },
    { id: 'v16501_a', plateNumber: '16501-ع', name: 'هيلوكس غماره 2014', driverName: 'فرع عدن', status: 'في الخدمة' },
    { id: 'v23320', plateNumber: '23320', name: 'دايهاتسو 2004', driverName: 'جلال المقطري', status: 'في الخدمة' },
    { id: 'v46840', plateNumber: '46840', name: 'هيلكس', driverName: 'غير محدد', status: 'في الخدمة' },
    { id: 'v22593', plateNumber: '22593', name: 'هيلكس2002', driverName: 'غير محدد', status: 'في الخدمة' },
    { id: 'v4234', plateNumber: '4234', name: 'هيلكس 1990', driverName: 'غير محدد', status: 'في الخدمة' },
    { id: 'v27870', plateNumber: '27870', name: 'هيلكس غمارة 2010', driverName: 'جمال جميل (صنعاء)', status: 'في الخدمة' }
  ];

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(initialVehicles);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);

  // نموذج الربط
  const [assignVehPlate, setAssignVehPlate] = useState('');
  const [assignDriverName, setAssignDriverName] = useState('');
  const [assignFromDate, setAssignFromDate] = useState('');
  const [assignToDate, setAssignToDate] = useState('');

  // نماذج التكويدات والقيم
  const [codes, setCodes] = useState<CodeCategories>({
    spareParts: ['فلاتر', 'سير محرك', 'قماشات فرامل'],
    oils: ['زيت محرك 20W50', 'زيت هيدروليك', 'زيت جير'],
    allocations: ['رحلة تعز - عدن', 'توزيع محلي', 'حركة مصنع'],
    batteries: ['بطارية 70 أمبير', 'بطارية 100 أمبير'],
    stations: ['محطة الزبيدي', 'محطة الشركة', 'محطة الأمل'],
    tires: ['إطار 22.5', 'إطار 16'],
    fuelTypes: ['ديزل', 'بنزين ممتاز', 'بنزين عادي']
  });

  const [itemPrices, setItemPrices] = useState<Record<string, string>>({
    'ديزل': '1000',
    'بنزين ممتاز': '1200',
    'زيت محرك 20W50': '5000'
  });

  const [newCodeInput, setNewCodeInput] = useState<string>('');
  const [editingCodeIndex, setEditingCodeIndex] = useState<number | null>(null);
  const [editingCodeText, setEditingCodeText] = useState<string>('');

  const [priceItemSelect, setPriceItemSelect] = useState<string>('');
  const [priceValueInput, setPriceValueInput] = useState<string>('');

  const [vehiclePermissions, setVehiclePermissions] = useState<Record<string, VehiclePermission>>({});
  const [userVehicle, setUserVehicle] = useState<Vehicle>(initialVehicles[0]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  // حقول إضافة طلب جديد (سائق)
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('');
  const [reqOilType, setReqOilType] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  const [userPassword, setUserPassword] = useState('000');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // استخراج قائمة السائقين التلقائية عند بدء التشغيل
  useEffect(() => {
    const extractedDrivers: Driver[] = initialVehicles
      .filter(v => v.driverName && v.driverName !== 'غير محدد')
      .map((v, idx) => ({
        id: `d_${idx}`,
        name: v.driverName,
        assignedVehiclePlate: v.plateNumber
      }));
    setDrivers(extractedDrivers);
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedVehicles = await AsyncStorage.getItem('@all_vehicles');
      const savedDrivers = await AsyncStorage.getItem('@all_drivers');
      const savedCodes = await AsyncStorage.getItem('@fleet_codes');
      const savedPrices = await AsyncStorage.getItem('@item_prices');
      const savedAssigns = await AsyncStorage.getItem('@vehicle_assignments');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedVehicles) setAllVehicles(JSON.parse(savedVehicles));
      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
      if (savedCodes) setCodes(JSON.parse(savedCodes));
      if (savedPrices) setItemPrices(JSON.parse(savedPrices));
      if (savedAssigns) setAssignments(JSON.parse(savedAssigns));
    } catch (e) {
      console.log('خطأ قراءة البيانات المحلية', e);
    }
  };

  const saveRequestsLocally = async (newList: ServiceRequest[]) => {
    setRequests(newList);
    await AsyncStorage.setItem('@fleet_requests', JSON.stringify(newList));
  };

  const saveCodesLocally = async (newCodes: CodeCategories) => {
    setCodes(newCodes);
    await AsyncStorage.setItem('@fleet_codes', JSON.stringify(newCodes));
  };

  const savePricesLocally = async (newPrices: Record<string, string>) => {
    setItemPrices(newPrices);
    await AsyncStorage.setItem('@item_prices', JSON.stringify(newPrices));
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
        v.plateNumber.trim() === loginUsername.trim() ||
        v.name.includes(loginUsername.trim())
    );

    if (foundVehicle) {
      setUserVehicle(foundVehicle);
    } else {
      const tempVeh: Vehicle = {
        id: `v_${Date.now()}`,
        name: 'سيارة عامة',
        plateNumber: loginUsername,
        driverName: 'سائق غير محدد',
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

  // ربط سيارة بسائق
  const handleAssignDriver = () => {
    if (!assignVehPlate || !assignDriverName) {
      Alert.alert('خطأ', 'يرجى اختيار السيارة والسائق');
      return;
    }
    const newAssign: VehicleAssignment = {
      id: `as_${Date.now()}`,
      vehiclePlate: assignVehPlate,
      driverName: assignDriverName,
      fromDate: assignFromDate || 'تاريخ اليوم',
      toDate: assignToDate || 'مفتوح'
    };
    const updated = [newAssign, ...assignments];
    setAssignments(updated);
    AsyncStorage.setItem('@vehicle_assignments', JSON.stringify(updated));

    // تحديث السائق الحالي في قائمة السيارات
    const updatedVehicles = allVehicles.map(v => 
      v.plateNumber === assignVehPlate ? { ...v, driverName: assignDriverName } : v
    );
    setAllVehicles(updatedVehicles);
    AsyncStorage.setItem('@all_vehicles', JSON.stringify(updatedVehicles));

    Alert.alert('تم الربط', `تم ربط السيارة (${assignVehPlate}) بالسائق (${assignDriverName}) بنجاح.`);
    setAssignVehPlate(''); setAssignDriverName(''); setAssignFromDate(''); setAssignToDate('');
  };

  // إضافة وتعديل التكويدات
  const handleAddCodeItem = (category: keyof CodeCategories) => {
    if (!newCodeInput.trim()) return;
    const updatedCategory = [...codes[category], newCodeInput.trim()];
    const newCodes = { ...codes, [category]: updatedCategory };
    saveCodesLocally(newCodes);
    setNewCodeInput('');
    Alert.alert('تم', 'تم إضافة التكويد بنجاح');
  };

  const handleEditCodeItem = (category: keyof CodeCategories, index: number) => {
    if (!editingCodeText.trim()) return;
    const updatedCategory = [...codes[category]];
    updatedCategory[index] = editingCodeText.trim();
    const newCodes = { ...codes, [category]: updatedCategory };
    saveCodesLocally(newCodes);
    setEditingCodeIndex(null);
    setEditingCodeText('');
    Alert.alert('تم', 'تم تعديل التكويد بنجاح');
  };

  const handleDeleteCodeItem = (category: keyof CodeCategories, index: number) => {
    const updatedCategory = codes[category].filter((_, i) => i !== index);
    const newCodes = { ...codes, [category]: updatedCategory };
    saveCodesLocally(newCodes);
  };

  // إضافة سعر لتكويد
  const handleSavePrice = () => {
    if (!priceItemSelect || !priceValueInput) {
      Alert.alert('خطأ', 'يرجى اختيار الصنف وإدخال السعر');
      return;
    }
    const updatedPrices = { ...itemPrices, [priceItemSelect]: priceValueInput };
    savePricesLocally(updatedPrices);
    Alert.alert('تم', `تم تحديد سعر (${priceItemSelect}) بـ ${priceValueInput} ريال.`);
    setPriceValueInput('');
  };

  // احتساب المبلغ تلقائياً للسائق عند كتابة الكمية واختيار النوع
  const handleQuantityOrTypeChange = (qty: string, selectedType: string) => {
    setReqQuantity(qty);
    const unitPrice = itemPrices[selectedType];
    if (unitPrice && !isNaN(Number(qty)) && Number(qty) > 0) {
      const total = Number(qty) * Number(unitPrice);
      setReqPriceAmount(total.toString());
    }
  };

  // تقديم طلب من السائق
  const handleCreateRequest = (type: any) => {
    if (!reqQuantity || (!reqAllocation && type !== 'وقود')) {
      Alert.alert('خطأ', 'يرجى إكمال البيانات الأساسية للطلب');
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
      allocation: reqAllocation || 'عادي',
      station: reqStation || codes.stations[0],
      fuelType: reqFuelType || codes.fuelTypes[0],
      notes: reqNotes,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    saveRequestsLocally(updated);

    Alert.alert('تم الإرسال', `تم إرسال طلب ${type} بنجاح.`);
    setReqProcessNo(''); setReqQuantity(''); setReqPriceAmount(''); setReqAllocation(''); setReqNotes('');
  };

  // شاشة تسجيل الدخول
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.whiteLoginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.whiteLoginCard}>
          <Text style={styles.inputLabel}>اسم المستخدم:</Text>
          <TextInput
            style={styles.whiteInput}
            placeholder="أدخل رقم السيارة أو اسم المستخدم"
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

      {/* الشريط العلوي */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? `السيارة (${userVehicle.plateNumber})` : 'أطلس - لوحة التحكم والمدير'}
        </Text>
      </View>

      {/* شريط الأيقونات العلوي */}
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
                <Text style={[styles.topNavText, currentTab === 'admin_dashboard' && styles.activeTopNavText]}>📊 إدارة الأسطول</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topNavBtn, currentTab === 'admin_coding' && styles.activeTopNavBtn]}
                onPress={() => setCurrentTab('admin_coding')}
              >
                <Text style={[styles.topNavText, currentTab === 'admin_coding' && styles.activeTopNavText]}>🏷️ التكويدات</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.topNavBtn, { backgroundColor: '#FFEBEE' }]} onPress={handleLogout}>
            <Text style={[styles.topNavText, { color: '#D32F2F' }]}>🚪 خروج</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* محتوى الشاشات */}
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
              <Text style={styles.emptyText}>لا توجد طلبات مسجلة حالياً.</Text>
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
                  <Text style={styles.cardDetail}>الكمية: {req.quantity}</Text>
                  <Text style={styles.cardDetail}>المبلغ: {req.priceAmount} ريال</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* --- شاشة تقديم طلب خدمة (سائق ببيانات مكودة وقوائم منسدلة) --- */}
        {currentTab === 'request_service' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إنشاء طلب جديد</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.subTabBtn, serviceSubTab === t && styles.activeSubTabBtn]}
                  onPress={() => {
                    setServiceSubTab(t);
                    setReqQuantity('');
                    setReqPriceAmount('');
                  }}
                >
                  <Text style={[styles.subTabText, serviceSubTab === t && styles.activeSubTabText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {serviceSubTab === 'وقود' && (
              <>
                <Text style={styles.inputLabel}>اختر نوع الوقود:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.fuelTypes.map((ft) => (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.chipBtn, reqFuelType === ft && styles.activeChipBtn]}
                      onPress={() => {
                        setReqFuelType(ft);
                        handleQuantityOrTypeChange(reqQuantity, ft);
                      }}
                    >
                      <Text style={[styles.chipText, reqFuelType === ft && styles.activeChipText]}>{ft}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>اختر المحطة:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.stations.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.chipBtn, reqStation === st && styles.activeChipBtn]}
                      onPress={() => setReqStation(st)}
                    >
                      <Text style={[styles.chipText, reqStation === st && styles.activeChipText]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {serviceSubTab === 'زيوت' && (
              <>
                <Text style={styles.inputLabel}>اختر نوع الزيت:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.oils.map((o) => (
                    <TouchableOpacity
                      key={o}
                      style={[styles.chipBtn, reqOilType === o && styles.activeChipBtn]}
                      onPress={() => {
                        setReqOilType(o);
                        handleQuantityOrTypeChange(reqQuantity, o);
                      }}
                    >
                      <Text style={[styles.chipText, reqOilType === o && styles.activeChipText]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.inputLabel}>اختر المخصص / خط السير:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {codes.allocations.map((alc) => (
                <TouchableOpacity
                  key={alc}
                  style={[styles.chipBtn, reqAllocation === alc && styles.activeChipBtn]}
                  onPress={() => setReqAllocation(alc)}
                >
                  <Text style={[styles.chipText, reqAllocation === alc && styles.activeChipText]}>{alc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>الكمية:</Text>
            <TextInput
              style={styles.whiteInput}
              value={reqQuantity}
              onChangeText={(q) => handleQuantityOrTypeChange(q, serviceSubTab === 'وقود' ? reqFuelType : reqOilType)}
              keyboardType="numeric"
              placeholder="أدخل الكمية المطلوبة"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>المبلغ التلقائي (بالريال):</Text>
            <TextInput
              style={[styles.whiteInput, { backgroundColor: '#EFEFEF' }]}
              value={reqPriceAmount}
              onChangeText={setReqPriceAmount}
              keyboardType="numeric"
              placeholder="المبلغ المالي"
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => handleCreateRequest(serviceSubTab)}>
              <Text style={styles.whiteSubmitBtnText}>إرسال الطلب 📤</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- لوحة تحكم الأدمن (قائمة السيارات، السائقين، الربط) --- */}
        {currentTab === 'admin_dashboard' && (
          <View style={styles.card}>
            <View style={styles.subTabRow}>
              <TouchableOpacity
                style={[styles.subTabBtn, dashboardSubTab === 'vehicles_list' && styles.activeSubTabBtn]}
                onPress={() => setDashboardSubTab('vehicles_list')}
              >
                <Text style={[styles.subTabText, dashboardSubTab === 'vehicles_list' && styles.activeSubTabText]}>🚘 قائمة السيارات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, dashboardSubTab === 'drivers_list' && styles.activeSubTabBtn]}
                onPress={() => setDashboardSubTab('drivers_list')}
              >
                <Text style={[styles.subTabText, dashboardSubTab === 'drivers_list' && styles.activeSubTabText]}>👨‍✈️ قائمة السائقين</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, dashboardSubTab === 'assign_driver' && styles.activeSubTabBtn]}
                onPress={() => setDashboardSubTab('assign_driver')}
              >
                <Text style={[styles.subTabText, dashboardSubTab === 'assign_driver' && styles.activeSubTabText]}>🔗 ربط سيارة بسائق</Text>
              </TouchableOpacity>
            </View>

            {dashboardSubTab === 'vehicles_list' && (
              <View>
                <Text style={styles.sectionTitle}>قائمة السيارات المسجلة ({allVehicles.length})</Text>
                {allVehicles.map((item) => (
                  <View key={item.id} style={styles.listItemRow}>
                    <Text style={styles.listItemTitle}>{item.name}</Text>
                    <Text style={styles.listItemSub}>اللوحة / الرقم: {item.plateNumber}</Text>
                    <Text style={styles.listItemSub}>السائق الحالي: {item.driverName || 'غير محدد'}</Text>
                  </View>
                ))}
              </View>
            )}

            {dashboardSubTab === 'drivers_list' && (
              <View>
                <Text style={styles.sectionTitle}>قائمة السائقين المرسلين ({drivers.length})</Text>
                {drivers.map((drv) => (
                  <View key={drv.id} style={styles.listItemRow}>
                    <Text style={styles.listItemTitle}>{drv.name}</Text>
                    <Text style={styles.listItemSub}>السيارات المرتبطة: {drv.assignedVehiclePlate || 'لا يوجد'}</Text>
                  </View>
                ))}
              </View>
            )}

            {dashboardSubTab === 'assign_driver' && (
              <View>
                <Text style={styles.sectionTitle}>ربط سيارة بسائق محدد</Text>

                <Text style={styles.inputLabel}>اختر رقم السيارة:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {allVehicles.slice(0, 30).map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.chipBtn, assignVehPlate === v.plateNumber && styles.activeChipBtn]}
                      onPress={() => setAssignVehPlate(v.plateNumber)}
                    >
                      <Text style={[styles.chipText, assignVehPlate === v.plateNumber && styles.activeChipText]}>{v.plateNumber}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>اختر السائق:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {drivers.slice(0, 30).map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.chipBtn, assignDriverName === d.name && styles.activeChipBtn]}
                      onPress={() => setAssignDriverName(d.name)}
                    >
                      <Text style={[styles.chipText, assignDriverName === d.name && styles.activeChipText]}>{d.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>من تاريخ:</Text>
                <TextInput style={styles.whiteInput} placeholder="YYYY-MM-DD" value={assignFromDate} onChangeText={setAssignFromDate} placeholderTextColor="#999" />

                <Text style={styles.inputLabel}>إلى تاريخ:</Text>
                <TextInput style={styles.whiteInput} placeholder="YYYY-MM-DD" value={assignToDate} onChangeText={setAssignToDate} placeholderTextColor="#999" />

                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleAssignDriver}>
                  <Text style={styles.whiteSubmitBtnText}>تأكيد الربط 🔗</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>سجل عمليات الربط:</Text>
                {assignments.map((asg) => (
                  <View key={asg.id} style={styles.listItemRow}>
                    <Text style={styles.listItemTitle}>السيارة: {asg.vehiclePlate} ⬅️ السائق: {asg.driverName}</Text>
                    <Text style={styles.listItemSub}>الفترة: من {asg.fromDate} إلى {asg.toDate}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* --- شاشة التكويدات وقيم الأسعار --- */}
        {currentTab === 'admin_coding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة التكويدات والأسعار</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              {(['stations', 'fuelTypes', 'oils', 'tires', 'batteries', 'spareParts', 'allocations', 'prices'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.subTabBtn, codingSubTab === cat && styles.activeSubTabBtn]}
                  onPress={() => setCodingSubTab(cat)}
                >
                  <Text style={[styles.subTabText, codingSubTab === cat && styles.activeSubTabText]}>
                    {cat === 'stations' ? 'المحطات' : cat === 'fuelTypes' ? 'الوقود' : cat === 'oils' ? 'الزيوت' : cat === 'prices' ? '💰 قيم الأسعار' : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {codingSubTab === 'prices' ? (
              <View>
                <Text style={styles.sectionTitle}>تحديد أسعار المواد والوقود</Text>
                <Text style={styles.inputLabel}>اختر الصنف/النوع المكود:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {[...codes.fuelTypes, ...codes.oils, ...codes.spareParts].map((itm) => (
                    <TouchableOpacity
                      key={itm}
                      style={[styles.chipBtn, priceItemSelect === itm && styles.activeChipBtn]}
                      onPress={() => setPriceItemSelect(itm)}
                    >
                      <Text style={[styles.chipText, priceItemSelect === itm && styles.activeChipText]}>{itm}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>حدد السعر (بالريال):</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={priceValueInput} onChangeText={setPriceValueInput} placeholder="السعر" placeholderTextColor="#999" />
                
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleSavePrice}>
                  <Text style={styles.whiteSubmitBtnText}>حفظ السعر 💾</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>الأسعار المحددة حالياً:</Text>
                {Object.keys(itemPrices).map((key) => (
                  <View key={key} style={styles.codeItemRow}>
                    <Text style={styles.codeItemText}>{key}: {itemPrices[key]} ريال</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>إضافة تكويد جديد:</Text>
                <TextInput
                  style={styles.whiteInput}
                  value={newCodeInput}
                  onChangeText={setNewCodeInput}
                  placeholder="اكتب اسم التكويد هنا..."
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => handleAddCodeItem(codingSubTab)}>
                  <Text style={styles.whiteSubmitBtnText}>إضافة التكويد ➕</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>العناصر المسجلة (مع إمكانية التعديل):</Text>
                {codes[codingSubTab]?.map((item, idx) => (
                  <View key={idx} style={styles.codeItemRow}>
                    {editingCodeIndex === idx ? (
                      <View style={{ flex: 1, flexDirection: 'row-reverse', alignItems: 'center' }}>
                        <TextInput style={[styles.whiteInput, { flex: 1, marginBottom: 0 }]} value={editingCodeText} onChangeText={setEditingCodeText} />
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2E7D32' }]} onPress={() => handleEditCodeItem(codingSubTab, idx)}>
                          <Text style={styles.actionBtnText}>حفظ</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flex: 1, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.codeItemText}>• {item}</Text>
                        <View style={{ flexDirection: 'row-reverse' }}>
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1976D2' }]} onPress={() => { setEditingCodeIndex(idx); setEditingCodeText(item); }}>
                            <Text style={styles.actionBtnText}>تعديل</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D32F2F' }]} onPress={() => handleDeleteCodeItem(codingSubTab, idx)}>
                            <Text style={styles.actionBtnText}>حذف</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
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
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'right', marginTop: 12, marginBottom: 8 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  badgeSuccess: { backgroundColor: '#2E7D32' },
  badgePending: { backgroundColor: '#ED6C02' },
  cardDetail: { fontSize: 13, color: '#444', textAlign: 'right', marginBottom: 4 },
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
  codeItemRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  codeItemText: { fontSize: 13, color: '#333', textAlign: 'right' },
  pickerRow: { flexDirection: 'row-reverse', marginBottom: 10 },
  chipBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F0F0F0', marginHorizontal: 4, borderWidth: 1, borderColor: '#CCC' },
  activeChipBtn: { backgroundColor: '#0D47A1', borderColor: '#0D47A1' },
  chipText: { fontSize: 12, color: '#333' },
  activeChipText: { color: '#FFF', fontWeight: 'bold' },
  listItemRow: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, marginBottom: 8, borderRightWidth: 4, borderRightColor: '#1565C0' },
  listItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right' },
  listItemSub: { fontSize: 12, color: '#666', textAlign: 'right', marginTop: 2 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginHorizontal: 2 },
  actionBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' }
});

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

/* =========================================================
   ATLAS FLEET APP
   VERSION: 1.9.0
   ========================================================= */

const APP_VERSION = '1.9.0';
const SYNC_API_URL = 'http://192.168.1.100:3000/api/sync';

type Role = 'user' | 'admin';

type RequestStatus =
  | 'قيد المراجعة'
  | 'مرفوض'
  | 'تم الاعتماد'
  | 'ملغي';

type RequestType =
  | 'وقود'
  | 'زيوت'
  | 'إطارات'
  | 'بطاريات'
  | 'صيانة وقطع غيار'
  | 'بنشر'
  | 'رحلة';

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  driverName: string;
  status: 'في الخدمة' | 'موقف';
}

interface ServiceRequest {
  id: string;
  type: RequestType;
  processNumber: string;
  date: string;
  quantity: string;
  priceAmount?: string;
  allocation: string;
  station?: string;
  fuelType?: string;
  oilType?: string;
  prevOdometer?: string;
  currentOdometer?: string;
  distanceTraveled?: string;
  hasAttachment?: boolean;
  notes?: string;
  status: RequestStatus;
  syncStatus: 'PENDING_PUSH' | 'SYNCED';
  vehicleId: string;
  vehiclePlate: string;
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
  maintenanceTypes: string[];
  punctureServices: string[];
  tripRegions: string[];
}

interface AuditLog {
  id: string;
  date: string;
  action: string;
  user: string;
  details: string;
}

export default function App() {

  /* =========================================================
     الإصدار
     ========================================================= */

  const APP_VERSION_DISPLAY = APP_VERSION;

  /* =========================================================
     تسجيل الدخول
     ========================================================= */

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests');

  /* =========================================================
     تبويبات السائق
     ========================================================= */

  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<RequestType>('وقود');

  /* =========================================================
     تبويبات المسؤول
     ========================================================= */

  const [adminSubTab, setAdminSubTab] = useState<string>('overview');
  const [adminRequestFilter, setAdminRequestFilter] = useState<RequestStatus | 'الكل'>('الكل');
  const [adminRequestTypeFilter, setAdminRequestTypeFilter] = useState<RequestType | 'الكل'>('الكل');
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminVehicleSearch, setAdminVehicleSearch] = useState<string>('');

  /* =========================================================
     التكويدات
     ========================================================= */

  const [codingSubTab, setCodingSubTab] = useState<keyof CodeCategories | 'prices'>('prices');
  const [priceSubCategory, setPriceSubCategory] = useState<
    'fuel' | 'oil' | 'battery' | 'tire' | 'spare' | 'maintenance' | 'puncture'
  >('fuel');

  /* =========================================================
     التقارير
     ========================================================= */

  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');
  const [reportType, setReportType] = useState<'detailed' | 'summary'>('detailed');
  const [reportVehicle, setReportVehicle] = useState<string>('الكل');
  const [reportExpenseType, setReportExpenseType] = useState<RequestType | 'الكل'>('الكل');

  /* =========================================================
     المزامنة
     ========================================================= */

  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('لم تتم المزامنة بعد');
  const [lastSyncDate, setLastSyncDate] = useState<string>('');

  /* =========================================================
     بيانات السيارات
     ========================================================= */

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

  /* =========================================================
     التكويدات
     ========================================================= */

  const [codes, setCodes] = useState<CodeCategories>({
    spareParts: ['فلاتر', 'سير محرك', 'قماشات فرامل'],
    oils: ['زيت محرك 20W50', 'زيت هيدروليك', 'زيت جير'],
    allocations: ['رحلة تعز - عدن', 'توزيع محلي', 'حركة مصنع'],
    batteries: ['بطارية 70 أمبير', 'بطارية 100 أمبير'],
    stations: ['محطة الزبيدي', 'محطة الشركة', 'محطة الأمل'],
    tires: ['إطار 22.5', 'إطار 16'],
    fuelTypes: ['ديزل', 'بنزين ممتاز', 'بنزين عادي'],
    maintenanceTypes: ['صيانة دورية', 'صيانة كهرباء', 'صيانة ميكانيكا', 'قطع غيار'],
    punctureServices: ['تركيب إطار', 'إصلاح بنشر', 'ترصيص', 'تبديل إطار'],
    tripRegions: ['تعز', 'صنعاء', 'الحديدة', 'عدن', 'إب', 'ذمار', 'رداع']
  });

  /* =========================================================
     الأسعار
     ========================================================= */

  const [itemPrices, setItemPrices] = useState<Record<string, string>>({
    'ديزل': '1000',
    'بنزين ممتاز': '1200',
    'بنزين عادي': '1100',
    'زيت محرك 20W50': '5000',
    'زيت هيدروليك': '6000',
    'زيت جير': '7000',
    'بطارية 70 أمبير': '45000',
    'بطارية 100 أمبير': '60000',
    'إطار 22.5': '180000',
    'إطار 16': '100000'
  });

  const [newCodeInput, setNewCodeInput] = useState<string>('');
  const [priceItemSelect, setPriceItemSelect] = useState<string>('');
  const [priceValueInput, setPriceValueInput] = useState<string>('');

  /* =========================================================
     المستخدم الحالي
     ========================================================= */

  const [userVehicle, setUserVehicle] = useState<Vehicle>(initialVehicles[0]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [userPassword, setUserPassword] = useState('000');
  const [adminPassword, setAdminPassword] = useState('000');

  /* =========================================================
     حقول طلب السائق
     ========================================================= */

  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('');
  const [reqOilType, setReqOilType] = useState('');
  const [reqPrevOdometer, setReqPrevOdometer] = useState('0');
  const [reqCurrentOdometer, setReqCurrentOdometer] = useState('');
  const [reqDistanceTraveled, setReqDistanceTraveled] = useState('0');
  const [reqAttachment, setReqAttachment] = useState<boolean>(false);
  const [reqNotes, setReqNotes] = useState('');

  /* =========================================================
     تحميل البيانات
     ========================================================= */

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedVehicles = await AsyncStorage.getItem('@all_vehicles');
      const savedCodes = await AsyncStorage.getItem('@fleet_codes');
      const savedPrices = await AsyncStorage.getItem('@item_prices');
      const savedLogs = await AsyncStorage.getItem('@fleet_audit_logs');
      const savedLastSync = await AsyncStorage.getItem('@fleet_last_sync');
      const savedAdminPassword = await AsyncStorage.getItem('@fleet_admin_password');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedVehicles) setAllVehicles(JSON.parse(savedVehicles));
      if (savedCodes) setCodes(JSON.parse(savedCodes));
      if (savedPrices) setItemPrices(JSON.parse(savedPrices));
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
      if (savedLastSync) setLastSyncDate(savedLastSync);
      if (savedAdminPassword) setAdminPassword(savedAdminPassword);
    } catch (e) {
      console.log('خطأ قراءة البيانات', e);
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

  const addAuditLog = async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      date: new Date().toLocaleString('ar-YE'),
      action,
      user: currentUserRole === 'admin' ? 'المسؤول' : userVehicle.driverName,
      details
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    await AsyncStorage.setItem('@fleet_audit_logs', JSON.stringify(updated));
  };

  /* =========================================================
     أفعال النظام
     ========================================================= */

  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم');
      return;
    }

    if (loginUsername.trim().toLowerCase() === 'admin' || loginUsername.trim() === 'المسؤول') {
      if (loginPassword !== '000' && loginPassword !== adminPassword) {
        Alert.alert('خطأ', 'كلمة مرور المسؤول غير صحيحة.');
        return;
      }
      setCurrentUserRole('admin');
      setIsLoggedIn(true);
      setCurrentTab('admin_dashboard');
      addAuditLog('تسجيل دخول', 'دخول المسؤول للنظام');
      return;
    }

    if (loginPassword !== '000' && loginPassword !== userPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة.');
      return;
    }

    const foundVehicle = allVehicles.find(v => v.plateNumber.trim() === loginUsername.trim());

    if (foundVehicle) {
      setUserVehicle(foundVehicle);
    } else {
      const tempVeh: Vehicle = {
        id: `v_${Date.now()}`,
        name: 'سيارة عامة',
        plateNumber: loginUsername,
        driverName: 'سائق عام',
        status: 'في الخدمة'
      };
      setUserVehicle(tempVeh);
    }

    setCurrentUserRole('user');
    setIsLoggedIn(true);
    setCurrentTab('my_requests');
    addAuditLog('تسجيل دخول', `دخول السائق للسيارة (${loginUsername})`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const prepareOilRequest = (vehId: string) => {
    const oilReqs = requests.filter(r => r.vehicleId === vehId && r.type === 'زيوت' && r.currentOdometer);
    if (oilReqs.length > 0) {
      setReqPrevOdometer(oilReqs[0].currentOdometer || '0');
    } else {
      setReqPrevOdometer('0');
    }
    setReqProcessNo(`OIL-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const prepareFuelRequest = () => {
    setReqProcessNo(`FUEL-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handleOdometerChange = (currentOdo: string) => {
    setReqCurrentOdometer(currentOdo);
    const curr = parseFloat(currentOdo) || 0;
    const prev = parseFloat(reqPrevOdometer) || 0;
    if (curr >= prev) {
      setReqDistanceTraveled((curr - prev).toString());
    } else {
      setReqDistanceTraveled('0');
    }
  };

  const handleQuantityOrTypeChange = (qty: string, selectedType: string) => {
    setReqQuantity(qty);
    const unitPrice = itemPrices[selectedType];
    if (unitPrice && !isNaN(Number(qty)) && Number(qty) > 0) {
      const total = Number(qty) * Number(unitPrice);
      setReqPriceAmount(total.toString());
    }
  };

  const handleCreateRequest = (type: RequestType) => {
    const todayDate = new Date().toISOString().split('T')[0];

    const newReq: ServiceRequest = {
      id: `APP-${Date.now()}`,
      type: type,
      processNumber: reqProcessNo || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: todayDate,
      quantity: reqQuantity || '1',
      priceAmount: reqPriceAmount || '0',
      allocation: reqAllocation || codes.allocations[0] || 'عادي',
      station: reqStation || codes.stations[0],
      fuelType: reqFuelType || codes.fuelTypes[0],
      oilType: reqOilType || codes.oils[0],
      prevOdometer: reqPrevOdometer,
      currentOdometer: reqCurrentOdometer,
      distanceTraveled: reqDistanceTraveled,
      hasAttachment: reqAttachment,
      notes: reqNotes,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      vehiclePlate: userVehicle.plateNumber,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    saveRequestsLocally(updated);
    addAuditLog('تقديم طلب', `تقديم طلب ${type} برقم ${newReq.processNumber}`);

    Alert.alert('تم الإرسال', `تم إرسال طلب ${type} بنجاح برقم عملية (${newReq.processNumber}).`);
    setReqQuantity(''); setReqPriceAmount(''); setReqNotes(''); setReqAttachment(false); setReqCurrentOdometer('');
  };

  const handleCancelRequest = (reqId: string) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'ملغي' as RequestStatus } : r);
    saveRequestsLocally(updated);
    addAuditLog('إلغاء طلب', `إلغاء الطلب رقم ${reqId}`);
    Alert.alert('تم الإلغاء', 'تم إلغاء الطلب بنجاح.');
  };

  const handleApproveOrReject = (reqId: string, newStatus: RequestStatus) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: newStatus } : r);
    saveRequestsLocally(updated);
    addAuditLog('تحديث طلب', `تحديث حالة الطلب ${reqId} إلى ${newStatus}`);
    Alert.alert('تم التحديث', `تم تعديل حالة الطلب إلى (${newStatus}).`);
  };

  const handleSavePrice = () => {
    if (!priceItemSelect || !priceValueInput) {
      Alert.alert('خطأ', 'يرجى اختيار الصنف وإدخال السعر');
      return;
    }
    const updatedPrices = { ...itemPrices, [priceItemSelect]: priceValueInput };
    savePricesLocally(updatedPrices);
    addAuditLog('تحديث سعر', `تعديل سعر ${priceItemSelect} إلى ${priceValueInput}`);
    Alert.alert('تم', `تم حفظ سعر (${priceItemSelect}) بـ ${priceValueInput} ريال.`);
    setPriceValueInput('');
  };

  const triggerSync = async () => {
    setSyncLoading(true);
    try {
      const pending = requests.filter(r => r.syncStatus === 'PENDING_PUSH');
      if (pending.length === 0) {
        Alert.alert('تنبيه', 'لا توجد طلبات جديدة معلقة للمزامنة.');
        setSyncLoading(false);
        return;
      }
      const response = await fetch(`${SYNC_API_URL}/push-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: pending })
      });

      if (response.ok) {
        const updated = requests.map(r => r.syncStatus === 'PENDING_PUSH' ? { ...r, syncStatus: 'SYNCED' as const } : r);
        saveRequestsLocally(updated);
        const now = new Date().toLocaleString('ar-YE');
        setLastSyncDate(now);
        await AsyncStorage.setItem('@fleet_last_sync', now);
        addAuditLog('مزامنة', 'مزامنة البيانات بنجاح مع السيرفر');
        Alert.alert('نجاح المزامنة', 'تمت مزامنة الطلبات المعلقة مع أوراكل بنجاح.');
      } else {
        Alert.alert('تنبيه', 'تم حفظ الطلبات محلياً. تعذر الوصول لسيرفر أوراكل حالياً.');
      }
    } catch (e) {
      Alert.alert('تنبيه', 'البيانات محفوظة محلياً. لم يتم الاتصال بالسيرفر.');
    } finally {
      setSyncLoading(false);
    }
  };

  const getFilteredUserRequests = () => {
    return requests.filter(r => {
      const isMyVehicle = r.vehiclePlate === userVehicle.plateNumber;
      let inDateRange = true;
      if (reportFromDate && r.date < reportFromDate) inDateRange = false;
      if (reportToDate && r.date > reportToDate) inDateRange = false;
      return isMyVehicle && inDateRange;
    });
  };

  const calculateUserSummary = () => {
    const filtered = getFilteredUserRequests();
    const summary: Record<string, { count: number; totalAmount: number; totalQty: number }> = {};

    filtered.forEach(r => {
      const amount = parseFloat(r.priceAmount || '0');
      const qty = parseFloat(r.quantity || '0');
      if (!summary[r.type]) {
        summary[r.type] = { count: 0, totalAmount: 0, totalQty: 0 };
      }
      summary[r.type].count += 1;
      summary[r.type].totalAmount += amount;
      summary[r.type].totalQty += qty;
    });

    return summary;
  };

  /* =========================================================
     عرض الشاشات (Render)
     ========================================================= */

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.whiteLoginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.whiteLoginCard}>
          <Text style={styles.appVersionTitle}>أطلس لإدارة الأسطول ({APP_VERSION_DISPLAY})</Text>
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

      {/* الشريط الترحيبي للرأس */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? `🚗 السائق: ${userVehicle.driverName} | السيارة: (${userVehicle.plateNumber})` : `أطلس - لوحة المسؤول (${APP_VERSION_DISPLAY})`}
        </Text>
      </View>

      {/* شريط الأيقونات العلوي */}
      <View style={styles.topBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavScroll}>
          {currentUserRole === 'user' ? (
            <>
              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'my_requests' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('my_requests')}>
                <Text style={[styles.topNavText, currentTab === 'my_requests' && styles.activeTopNavText]}>📋 طلباتي</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'user_reports' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('user_reports')}>
                <Text style={[styles.topNavText, currentTab === 'user_reports' && styles.activeTopNavText]}>📊 التقارير</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'vehicle_info' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('vehicle_info')}>
                <Text style={[styles.topNavText, currentTab === 'vehicle_info' && styles.activeTopNavText]}>🚘 السيارة</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'request_service' && styles.activeTopNavBtn]} onPress={() => { setCurrentTab('request_service'); prepareFuelRequest(); }}>
                <Text style={[styles.topNavText, currentTab === 'request_service' && styles.activeTopNavText]}>🛠️ طلب خدمة</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'admin_dashboard' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('admin_dashboard')}>
                <Text style={[styles.topNavText, currentTab === 'admin_dashboard' && styles.activeTopNavText]}>📥 طلبات السائقين</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'admin_coding' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('admin_coding')}>
                <Text style={[styles.topNavText, currentTab === 'admin_coding' && styles.activeTopNavText]}>🏷️ التكويدات والأسعار</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'admin_sync' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('admin_sync')}>
                <Text style={[styles.topNavText, currentTab === 'admin_sync' && styles.activeTopNavText]}>🔄 المزامنة والسجلات</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.topNavBtn, { backgroundColor: '#FFEBEE' }]} onPress={handleLogout}>
            <Text style={[styles.topNavText, { color: '#D32F2F' }]}>🚪 خروج</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.contentContainer}>

        {/* --- شاشة تقارير السائق --- */}
        {currentTab === 'user_reports' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 تقارير مصروفات السيارة</Text>

            <View style={styles.subTabRow}>
              <TouchableOpacity style={[styles.chipBtn, reportType === 'detailed' && styles.activeChipBtn]} onPress={() => setReportType('detailed')}>
                <Text style={[styles.chipText, reportType === 'detailed' && styles.activeChipText]}>تقرير تفصيلي</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chipBtn, reportType === 'summary' && styles.activeChipBtn]} onPress={() => setReportType('summary')}>
                <Text style={[styles.chipText, reportType === 'summary' && styles.activeChipText]}>تقرير إجمالي</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>من تاريخ (YYYY-MM-DD):</Text>
            <TextInput style={styles.whiteInput} value={reportFromDate} onChangeText={setReportFromDate} placeholder="مثال: 2026-01-01" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>إلى تاريخ (YYYY-MM-DD):</Text>
            <TextInput style={styles.whiteInput} value={reportToDate} onChangeText={setReportToDate} placeholder="مثال: 2026-12-31" placeholderTextColor="#999" />

            {reportType === 'detailed' ? (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionTitle}>نتائج العمليات التفصيلية ({getFilteredUserRequests().length}):</Text>
                {getFilteredUserRequests().length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد عمليات مسجلة خلال هذه الفترة.</Text>
                ) : (
                  getFilteredUserRequests().map(req => (
                    <View key={req.id} style={styles.listItemRow}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.listItemTitle}>{req.type} - {req.processNumber}</Text>
                        <Text style={[styles.badge, req.status === 'تم الاعتماد' ? styles.badgeSuccess : req.status === 'مرفوض' ? styles.badgeDanger : req.status === 'ملغي' ? styles.badgeCancel : styles.badgePending]}>{req.status}</Text>
                      </View>
                      <Text style={styles.listItemSub}>التاريخ: {req.date} | الكمية: {req.quantity}</Text>
                      <Text style={styles.listItemSub}>المبلغ الإجمالي: {req.priceAmount || '0'} ريال</Text>
                      {req.distanceTraveled ? <Text style={styles.listItemSub}>المسافة المقطوعة: {req.distanceTraveled} كم</Text> : null}
                    </View>
                  ))
                )}
              </View>
            ) : (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionTitle}>الملخص الإجمالي حسب نوع المصروفات:</Text>
                {Object.keys(calculateUserSummary()).length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد بيانات إجمالية بالفترة المحددة.</Text>
                ) : (
                  Object.keys(calculateUserSummary()).map(typeKey => {
                    const item = calculateUserSummary()[typeKey];
                    return (
                      <View key={typeKey} style={styles.summaryCard}>
                        <Text style={styles.listItemTitle}>نوع المصروف: {typeKey}</Text>
                        <Text style={styles.listItemSub}>عدد العمليات: {item.count}</Text>
                        <Text style={styles.listItemSub}>إجمالي الكميات: {item.totalQty}</Text>
                        <Text style={[styles.listItemSub, { fontWeight: 'bold', color: '#2E7D32' }]}>إجمالي المبالغ: {item.totalAmount} ريال</Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {/* --- شاشة طلبات السائقين (حساب المسؤول) --- */}
        {currentTab === 'admin_dashboard' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📥 شاشة طلبات السائقين والمصروفات</Text>

            <TextInput
              style={styles.whiteInput}
              placeholder="بحث برقم السيارة أو اسم السائق أو رقم العملية..."
              value={adminSearch}
              onChangeText={setAdminSearch}
              placeholderTextColor="#999"
            />

            {requests.filter(r => 
              (adminSearch === '' || r.vehiclePlate.includes(adminSearch) || r.driverName.includes(adminSearch) || r.processNumber.includes(adminSearch))
            ).length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات مطابقة للبحث.</Text>
            ) : (
              requests.filter(r => 
                (adminSearch === '' || r.vehiclePlate.includes(adminSearch) || r.driverName.includes(adminSearch) || r.processNumber.includes(adminSearch))
              ).map((req) => (
                <View key={req.id} style={styles.requestAdminCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{req.type} - {req.processNumber}</Text>
                    <Text style={[styles.badge, req.status === 'تم الاعتماد' ? styles.badgeSuccess : req.status === 'مرفوض' ? styles.badgeDanger : req.status === 'ملغي' ? styles.badgeCancel : styles.badgePending]}>
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.cardDetail}>السيارة: {req.vehiclePlate} | السائق: {req.driverName}</Text>
                  <Text style={styles.cardDetail}>التاريخ: {req.date} | الكمية: {req.quantity}</Text>
                  {req.priceAmount ? <Text style={styles.cardDetail}>المبلغ الإجمالي: {req.priceAmount} ريال</Text> : null}
                  {req.currentOdometer ? <Text style={styles.cardDetail}>العداد الحالي: {req.currentOdometer} (الفارق: {req.distanceTraveled} كم)</Text> : null}
                  {req.notes ? <Text style={styles.cardDetail}>ملاحظات: {req.notes}</Text> : null}
                  {req.hasAttachment ? <Text style={{ color: '#0D47A1', fontSize: 12, marginTop: 2 }}>📎 يحتوي على مرفق (صورة الفاتورة)</Text> : null}

                  {req.status === 'قيد المراجعة' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={[styles.approveBtn]} onPress={() => handleApproveOrReject(req.id, 'تم الاعتماد')}>
                        <Text style={styles.btnText}>اعتماد ✅</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rejectBtn]} onPress={() => handleApproveOrReject(req.id, 'مرفوض')}>
                        <Text style={styles.btnText}>رفض ❌</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* --- شاشة التكويدات والأسعار المرتبة --- */}
        {currentTab === 'admin_coding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة الأسعار والتكويدات</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'prices' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('prices')}>
                <Text style={[styles.subTabText, codingSubTab === 'prices' && styles.activeSubTabText]}>💰 قيم الأسعار</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'stations' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('stations')}>
                <Text style={[styles.subTabText, codingSubTab === 'stations' && styles.activeSubTabText]}>⛽ المحطات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'fuelTypes' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('fuelTypes')}>
                <Text style={[styles.subTabText, codingSubTab === 'fuelTypes' && styles.activeSubTabText]}>🛢️ أنواع الوقود</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'oils' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('oils')}>
                <Text style={[styles.subTabText, codingSubTab === 'oils' && styles.activeSubTabText]}>💧 الزيوت</Text>
              </TouchableOpacity>
            </ScrollView>

            {codingSubTab === 'prices' ? (
              <View>
                <Text style={styles.sectionTitle}>تصنيف قيم الأسعار:</Text>
                <View style={styles.subTabRow}>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'fuel' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('fuel')}>
                    <Text style={[styles.chipText, priceSubCategory === 'fuel' && styles.activeChipText]}>أسعار الوقود (لتر)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'oil' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('oil')}>
                    <Text style={[styles.chipText, priceSubCategory === 'oil' && styles.activeChipText]}>أسعار الزيت</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'battery' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('battery')}>
                    <Text style={[styles.chipText, priceSubCategory === 'battery' && styles.activeChipText]}>البطاريات</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'tire' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('tire')}>
                    <Text style={[styles.chipText, priceSubCategory === 'tire' && styles.activeChipText]}>الإطارات</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>اختر الصنف لتحديد السعر:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {(priceSubCategory === 'fuel' ? codes.fuelTypes : priceSubCategory === 'oil' ? codes.oils : priceSubCategory === 'battery' ? codes.batteries : priceSubCategory === 'tire' ? codes.tires : codes.spareParts).map((itm) => (
                    <TouchableOpacity key={itm} style={[styles.chipBtn, priceItemSelect === itm && styles.activeChipBtn]} onPress={() => setPriceItemSelect(itm)}>
                      <Text style={[styles.chipText, priceItemSelect === itm && styles.activeChipText]}>{itm}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>السعر المحدد (ريال):</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={priceValueInput} onChangeText={setPriceValueInput} placeholder="أدخل السعر هنا..." placeholderTextColor="#999" />

                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleSavePrice}>
                  <Text style={styles.whiteSubmitBtnText}>حفظ السعر 💾</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>قائمة الأسعار الحالية المسجلة:</Text>
                {Object.keys(itemPrices).map((k) => (
                  <View key={k} style={styles.codeItemRow}>
                    <Text style={styles.codeItemText}>{k}: {itemPrices[k]} ريال</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>إضافة عنصر جديد:</Text>
                <TextInput style={styles.whiteInput} value={newCodeInput} onChangeText={setNewCodeInput} placeholder="اسم التكويد..." placeholderTextColor="#999" />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => {
                  if (newCodeInput) {
                    const updated = [...codes[codingSubTab as keyof CodeCategories], newCodeInput];
                    saveCodesLocally({ ...codes, [codingSubTab]: updated });
                    setNewCodeInput('');
                  }
                }}>
                  <Text style={styles.whiteSubmitBtnText}>إضافة ➕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* --- شاشة المزامنة وسجلات النظام (حساب المسؤول) --- */}
        {currentTab === 'admin_sync' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔄 المزامنة وسجلات الحركة</Text>

            <TouchableOpacity style={styles.whiteSubmitBtn} onPress={triggerSync} disabled={syncLoading}>
              {syncLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.whiteSubmitBtnText}>بدء المزامنة مع أوراكل الآن 🔄</Text>}
            </TouchableOpacity>

            <Text style={[styles.listItemSub, { marginTop: 10 }]}>آخر تاريخ مزامنة: {lastSyncDate || 'لم تكتمل المزامنة بعد'}</Text>

            <Text style={styles.sectionTitle}>سجل عمليات النظام (Audit Log):</Text>
            {auditLogs.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد سجلات حالياً.</Text>
            ) : (
              auditLogs.map(log => (
                <View key={log.id} style={styles.codeItemRow}>
                  <Text style={styles.listItemTitle}>{log.action} - ({log.user})</Text>
                  <Text style={styles.listItemSub}>{log.date} | {log.details}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* --- شاشة طلب مصروف للسائق --- */}
        {currentTab === 'request_service' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إنشاء طلب مصروفات</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              {(['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار', 'بنشر', 'رحلة'] as RequestType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.subTabBtn, serviceSubTab === t && styles.activeSubTabBtn]}
                  onPress={() => {
                    setServiceSubTab(t);
                    if (t === 'زيوت') prepareOilRequest(userVehicle.id);
                    if (t === 'وقود') prepareFuelRequest();
                  }}
                >
                  <Text style={[styles.subTabText, serviceSubTab === t && styles.activeSubTabText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>رقم العملية (تلقائي):</Text>
            <TextInput style={[styles.whiteInput, { backgroundColor: '#E0E0E0' }]} value={reqProcessNo} editable={false} />

            {/* طلب الوقود */}
            {serviceSubTab === 'وقود' && (
              <View>
                <Text style={styles.inputLabel}>نوع الوقود:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.fuelTypes.map((ft) => (
                    <TouchableOpacity key={ft} style={[styles.chipBtn, reqFuelType === ft && styles.activeChipBtn]} onPress={() => { setReqFuelType(ft); handleQuantityOrTypeChange(reqQuantity, ft); }}>
                      <Text style={[styles.chipText, reqFuelType === ft && styles.activeChipText]}>{ft}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>المحطة:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.stations.map((st) => (
                    <TouchableOpacity key={st} style={[styles.chipBtn, reqStation === st && styles.activeChipBtn]} onPress={() => setReqStation(st)}>
                      <Text style={[styles.chipText, reqStation === st && styles.activeChipText]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>الكمية (باللتر):</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={reqQuantity} onChangeText={(q) => handleQuantityOrTypeChange(q, reqFuelType)} placeholder="أدخل عدد اللترات" placeholderTextColor="#999" />

                <Text style={styles.inputLabel}>المخصص:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.allocations.map((alc) => (
                    <TouchableOpacity key={alc} style={[styles.chipBtn, reqAllocation === alc && styles.activeChipBtn]} onPress={() => setReqAllocation(alc)}>
                      <Text style={[styles.chipText, reqAllocation === alc && styles.activeChipText]}>{alc}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>المبلغ الإجمالي (تلقائي بالريال):</Text>
                <TextInput style={[styles.whiteInput, { backgroundColor: '#F0F4C3' }]} keyboardType="numeric" value={reqPriceAmount} onChangeText={setReqPriceAmount} />
              </View>
            )}

            {/* طلب الزيوت */}
            {serviceSubTab === 'زيوت' && (
              <View>
                <Text style={styles.inputLabel}>اختر نوع الزيت:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.oils.map((o) => (
                    <TouchableOpacity key={o} style={[styles.chipBtn, reqOilType === o && styles.activeChipBtn]} onPress={() => setReqOilType(o)}>
                      <Text style={[styles.chipText, reqOilType === o && styles.activeChipText]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>الكمية:</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={reqQuantity} onChangeText={setReqQuantity} placeholder="عدد العلب" placeholderTextColor="#999" />

                <Text style={styles.inputLabel}>العداد السابق (تلقائي من آخر عملية):</Text>
                <TextInput style={[styles.whiteInput, { backgroundColor: '#E0E0E0' }]} value={reqPrevOdometer} editable={false} />

                <Text style={styles.inputLabel}>العداد الحالي:</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={reqCurrentOdometer} onChangeText={handleOdometerChange} placeholder="أدخل قراءة العداد الحالية" placeholderTextColor="#999" />

                <Text style={styles.inputLabel}>المسافة المقطوعة (الفارق كم):</Text>
                <TextInput style={[styles.whiteInput, { backgroundColor: '#E8F5E9' }]} value={reqDistanceTraveled} editable={false} />
              </View>
            )}

            <Text style={styles.inputLabel}>ملاحظات:</Text>
            <TextInput style={styles.whiteInput} value={reqNotes} onChangeText={setReqNotes} placeholder="أي ملاحظات إضافية" placeholderTextColor="#999" />

            <TouchableOpacity style={[styles.attachBtn, reqAttachment && styles.activeAttachBtn]} onPress={() => setReqAttachment(!reqAttachment)}>
              <Text style={styles.attachBtnText}>{reqAttachment ? '✅ تم إرفاق صورة الفاتورة/العداد' : '📎 إرفاق صورة الفاتورة / العداد'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => handleCreateRequest(serviceSubTab)}>
              <Text style={styles.whiteSubmitBtnText}>إرسال الطلب 📤</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- طلباتي (حساب المستخدم) --- */}
        {currentTab === 'my_requests' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>سجل طلباتي المسجلة</Text>
            {requests.filter(r => r.vehiclePlate === userVehicle.plateNumber).length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات سابقة.</Text>
            ) : (
              requests.filter(r => r.vehiclePlate === userVehicle.plateNumber).map((req) => (
                <View key={req.id} style={styles.listItemRow}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.listItemTitle}>{req.type} ({req.processNumber})</Text>
                    <Text style={[styles.badge, req.status === 'تم الاعتماد' ? styles.badgeSuccess : req.status === 'مرفوض' ? styles.badgeDanger : req.status === 'ملغي' ? styles.badgeCancel : styles.badgePending]}>
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.listItemSub}>التاريخ: {req.date} | الكمية: {req.quantity}</Text>
                  {req.priceAmount ? <Text style={styles.listItemSub}>المبلغ: {req.priceAmount} ريال</Text> : null}

                  {req.status === 'قيد المراجعة' && (
                    <TouchableOpacity style={[styles.rejectBtn, { marginTop: 8, alignSelf: 'flex-start' }]} onPress={() => handleCancelRequest(req.id)}>
                      <Text style={styles.btnText}>إلغاء الطلب 🛑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* --- معلومات السيارة (حساب المستخدم) --- */}
        {currentTab === 'vehicle_info' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>بيانات السيارة الحالية</Text>
            <Text style={styles.listItemSub}>اسم السيارة: {userVehicle.name}</Text>
            <Text style={styles.listItemSub}>رقم اللوحة: {userVehicle.plateNumber}</Text>
            <Text style={styles.listItemSub}>اسم السائق المعتمد: {userVehicle.driverName}</Text>
            <Text style={styles.listItemSub}>الحالة: {userVehicle.status}</Text>
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
  appVersionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1', textAlign: 'center', marginBottom: 15 },
  header: { backgroundColor: '#1565C0', padding: 15, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  topBarContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  topNavScroll: { flexDirection: 'row-reverse', paddingHorizontal: 10, paddingVertical: 8 },
  topNavBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4, backgroundColor: '#F0F2F5' },
  activeTopNavBtn: { backgroundColor: '#0D47A1' },
  topNavText: { fontSize: 13, color: '#424242', fontWeight: 'bold' },
  activeTopNavText: { color: '#FFFFFF' },
  contentContainer: { flex: 1, padding: 15 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.08)' },
  requestAdminCard: { backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  summaryCard: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 8, borderRightWidth: 4, borderRightColor: '#2E7D32' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'right', marginTop: 12, marginBottom: 8 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  badgeSuccess: { backgroundColor: '#2E7D32' },
  badgeDanger: { backgroundColor: '#C62828' },
  badgeCancel: { backgroundColor: '#757575' },
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
  actionRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 },
  approveBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  rejectBtn: { backgroundColor: '#C62828', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  attachBtn: { backgroundColor: '#ECEFF1', padding: 10, borderRadius: 8, alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#CFD8DC' },
  activeAttachBtn: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  attachBtnText: { color: '#37474F', fontSize: 13, fontWeight: 'bold' }
});

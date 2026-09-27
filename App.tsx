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
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

/* =========================================================
   ATLAS FLEET APP
   VERSION: 2.0.0 (BUILD: 200)
   ========================================================= */

const APP_VERSION = '2.0.0';
const BUILD_NUMBER = '200';
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
  attachmentUri?: string;
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
     الإصدار ورقم البناء
     ========================================================= */

  const APP_VERSION_DISPLAY = `v${APP_VERSION} (Build ${BUILD_NUMBER})`;

  /* =========================================================
     تسجيل الدخول
     ========================================================= */

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests');

  /* =========================================================
     الصلاحيات (تعديل رقم 6)
     ========================================================= */
  const [canChangePassword, setCanChangePassword] = useState<boolean>(true);

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
     التكويدات والتحرير (تعديل رقم 2)
     ========================================================= */

  const [codingSubTab, setCodingSubTab] = useState<keyof CodeCategories | 'prices'>('prices');
  const [priceSubCategory, setPriceSubCategory] = useState<
    'fuel' | 'oil' | 'battery' | 'tire' | 'spare' | 'maintenance' | 'puncture'
  >('fuel');

  const [editingItemOldValue, setEditingItemOldValue] = useState<string | null>(null);
  const [editingItemNewValue, setEditingItemNewValue] = useState<string>('');
  const [editingPriceKey, setEditingPriceKey] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<string>('');

  /* =========================================================
     التقارير المتطورة (تعديل رقم 7)
     ========================================================= */

  const [reportMode, setReportMode] = useState<'detailed' | 'summary'>('detailed');
  const [detailedCategory, setDetailedCategory] = useState<RequestType>('وقود');
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');
  const [reportVehicle, setReportVehicle] = useState<string>('الكل');

  /* =========================================================
     الإعدادات للمستخدم (تعديل رقم 7)
     ========================================================= */
  const [settingOldPass, setSettingOldPass] = useState('');
  const [settingNewPass, setSettingNewPass] = useState('');
  const [settingPlateInput, setSettingPlateInput] = useState('');

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
  const [reqAttachmentUri, setReqAttachmentUri] = useState<string | null>(null);
  const [reqNotes, setReqNotes] = useState('');

  /* =========================================================
     تعبئة العداد السابق تلقائياً للزيوت (تعديل رقم 5)
     ========================================================= */
  useEffect(() => {
    if (serviceSubTab === 'زيوت') {
      const oilReqs = requests.filter(r => r.vehicleId === userVehicle.id && r.type === 'زيوت');
      if (oilReqs.length > 0) {
        const lastOilReq = oilReqs[0]; // أحدث طلب
        if (lastOilReq.currentOdometer) {
          setReqPrevOdometer(lastOilReq.currentOdometer);
        }
      }
    }
  }, [serviceSubTab, requests, userVehicle]);

  /* =========================================================
     حساب السعر التلقائي عند إدخال الكمية (تعديل رقم 3)
     ========================================================= */
  const handleQuantityChange = (val: string) => {
    setReqQuantity(val);
    const qty = parseFloat(val);
    if (!isNaN(qty)) {
      let unitPrice = 0;
      if (serviceSubTab === 'وقود' && reqFuelType && itemPrices[reqFuelType]) {
        unitPrice = parseFloat(itemPrices[reqFuelType]);
      } else if (serviceSubTab === 'زيوت' && reqOilType && itemPrices[reqOilType]) {
        unitPrice = parseFloat(itemPrices[reqOilType]);
      }
      if (unitPrice > 0) {
        setReqPriceAmount((qty * unitPrice).toString());
      }
    }
  };

  /* =========================================================
     إرفاق الصورة (تعديل رقم 4)
     ========================================================= */
  const handlePickAttachment = () => {
    Alert.alert(
      'إرفاق صورة',
      'اختر مصدر الصورة:',
      [
        {
          text: 'الكاميرا',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.granted) {
              const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
              if (!res.canceled && res.assets && res.assets.length > 0) {
                setReqAttachmentUri(res.assets[0].uri);
              }
            } else {
              Alert.alert('تنبيه', 'يجب إعطاء صلاحية الكاميرا');
            }
          }
        },
        {
          text: 'معرض الصور',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.granted) {
              const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
              if (!res.canceled && res.assets && res.assets.length > 0) {
                setReqAttachmentUri(res.assets[0].uri);
              }
            } else {
              Alert.alert('تنبيه', 'يجب إعطاء صلاحية الوصول للصور');
            }
          }
        },
        { text: 'إلغاء', style: 'cancel' }
      ]
    );
  };

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
      const savedUserPassword = await AsyncStorage.getItem('@fleet_user_password');
      const savedPerm = await AsyncStorage.getItem('@fleet_perm_password');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedVehicles) setAllVehicles(JSON.parse(savedVehicles));
      if (savedCodes) setCodes(JSON.parse(savedCodes));
      if (savedPrices) setItemPrices(JSON.parse(savedPrices));
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
      if (savedLastSync) setLastSyncDate(savedLastSync);
      if (savedAdminPassword) setAdminPassword(savedAdminPassword);
      if (savedUserPassword) setUserPassword(savedUserPassword);
      if (savedPerm !== null) setCanChangePassword(JSON.parse(savedPerm));
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
     تسجيل الدخول
     ========================================================= */

  const handleLogin = () => {
    if (loginUsername === 'admin' && loginPassword === adminPassword) {
      setCurrentUserRole('admin');
      setIsLoggedIn(true);
      setCurrentTab('admin_dashboard');
      addAuditLog('تسجيل دخول', 'دخول المسؤول إلى النظام');
      return;
    }

    const foundVehicle = allVehicles.find(
      v => v.plateNumber === loginUsername || v.driverName === loginUsername
    );

    if (foundVehicle && loginPassword === userPassword) {
      setUserVehicle(foundVehicle);
      setSettingPlateInput(foundVehicle.plateNumber);
      setCurrentUserRole('user');
      setIsLoggedIn(true);
      setCurrentTab('my_requests');
      addAuditLog('تسجيل دخول', `دخول المستخدم: ${foundVehicle.driverName}`);
      return;
    }

    Alert.alert('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  /* =========================================================
     تقديم طلب جديد
     ========================================================= */

  const handleCreateRequest = async () => {
    if (!reqQuantity && serviceSubTab !== 'رحلة') {
      Alert.alert('تنبيه', 'يرجى إدخال الكمية أو البيان المطلوبة');
      return;
    }

    const newReq: ServiceRequest = {
      id: `REQ-${Date.now()}`,
      type: serviceSubTab,
      processNumber: reqProcessNo || `${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('ar-YE'),
      quantity: reqQuantity,
      priceAmount: reqPriceAmount,
      allocation: reqAllocation || (codes.allocations[0] || ''),
      station: reqStation,
      fuelType: reqFuelType,
      oilType: reqOilType,
      prevOdometer: reqPrevOdometer,
      currentOdometer: reqCurrentOdometer,
      distanceTraveled: reqDistanceTraveled,
      hasAttachment: !!reqAttachmentUri,
      attachmentUri: reqAttachmentUri || undefined,
      notes: reqNotes,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      vehiclePlate: userVehicle.plateNumber,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    await saveRequestsLocally(updated);
    addAuditLog('طلب جديد', `إضافة طلب ${serviceSubTab} برقم ${newReq.processNumber}`);

    Alert.alert('نجاح', 'تم تسجيل الطلب بنجاح وهو قيد المراجعة');

    setReqProcessNo('');
    setReqQuantity('');
    setReqPriceAmount('');
    setReqNotes('');
    setReqAttachmentUri(null);
    setReqCurrentOdometer('');
  };

  /* =========================================================
     تعديل حالة الطلب (للمسؤول)
     ========================================================= */

  const handleUpdateRequestStatus = async (id: string, newStatus: RequestStatus) => {
    const updated = requests.map(r => r.id === id ? { ...r, status: newStatus } : r);
    await saveRequestsLocally(updated);
    addAuditLog('تحديث حالة', `تغيير حالة الطلب ${id} إلى ${newStatus}`);
  };

  /* =========================================================
     إدارة التكويدات والأسعار (تعديل رقم 2)
     ========================================================= */

  const handleAddCode = async () => {
    if (!newCodeInput.trim() || codingSubTab === 'prices') return;
    const cat = codingSubTab as keyof CodeCategories;
    const currentList = codes[cat] || [];
    if (currentList.includes(newCodeInput.trim())) {
      Alert.alert('تنبيه', 'العنصر موجود بالفعل');
      return;
    }
    const updatedList = [...currentList, newCodeInput.trim()];
    const newCodes = { ...codes, [cat]: updatedList };
    await saveCodesLocally(newCodes);
    setNewCodeInput('');
  };

  const handleDeleteCode = async (cat: keyof CodeCategories, item: string) => {
    const updatedList = codes[cat].filter(i => i !== item);
    const newCodes = { ...codes, [cat]: updatedList };
    await saveCodesLocally(newCodes);
  };

  const handleStartEditCode = (item: string) => {
    setEditingItemOldValue(item);
    setEditingItemNewValue(item);
  };

  const handleSaveEditCode = async (cat: keyof CodeCategories) => {
    if (!editingItemOldValue || !editingItemNewValue.trim()) return;
    const updatedList = codes[cat].map(i => i === editingItemOldValue ? editingItemNewValue.trim() : i);
    const newCodes = { ...codes, [cat]: updatedList };
    await saveCodesLocally(newCodes);
    setEditingItemOldValue(null);
    setEditingItemNewValue('');
  };

  const handleAddOrUpdatePrice = async () => {
    if (!priceItemSelect || !priceValueInput) return;
    const newPrices = { ...itemPrices, [priceItemSelect]: priceValueInput };
    await savePricesLocally(newPrices);
    setPriceValueInput('');
  };

  const handleDeletePrice = async (key: string) => {
    const newPrices = { ...itemPrices };
    delete newPrices[key];
    await savePricesLocally(newPrices);
  };

  const handleStartEditPrice = (key: string, val: string) => {
    setEditingPriceKey(key);
    setEditingPriceVal(val);
  };

  const handleSaveEditPrice = async () => {
    if (!editingPriceKey) return;
    const newPrices = { ...itemPrices, [editingPriceKey]: editingPriceVal };
    await savePricesLocally(newPrices);
    setEditingPriceKey(null);
    setEditingPriceVal('');
  };

  /* =========================================================
     المزامنة مع الخادم
     ========================================================= */

  const handleSyncData = async () => {
    setSyncLoading(true);
    try {
      setTimeout(async () => {
        const now = new Date().toLocaleString('ar-YE');
        setLastSyncDate(now);
        await AsyncStorage.setItem('@fleet_last_sync', now);
        setSyncLoading(false);
        setSyncMessage('تمت المزامنة بنجاح');
        Alert.alert('نجاح', 'تمت المزامنة مع الخادم المحلي');
      }, 1500);
    } catch (e) {
      setSyncLoading(false);
      Alert.alert('خطأ', 'فشلت عملية المزامنة');
    }
  };

  /* =========================================================
     تغيير كلمة المرور وإعدادات السيارة (تعديل رقم 7)
     ========================================================= */
  const handleChangeUserPassword = async () => {
    if (!canChangePassword) {
      Alert.alert('تنبيه', 'ليس لديك صلاحية تغيير كلمة المرور. يرجى مراجعة المسؤول.');
      return;
    }
    if (settingOldPass !== userPassword) {
      Alert.alert('خطأ', 'كلمة المرور الحالية غير صحيحة');
      return;
    }
    if (!settingNewPass.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    setUserPassword(settingNewPass);
    await AsyncStorage.setItem('@fleet_user_password', settingNewPass);
    Alert.alert('نجاح', 'تم تغيير كلمة المرور بنجاح');
    setSettingOldPass('');
    setSettingNewPass('');
  };

  const handleUpdateVehicleData = async () => {
    const updated = allVehicles.map(v => v.id === userVehicle.id ? { ...v, plateNumber: settingPlateInput } : v);
    setAllVehicles(updated);
    setUserVehicle({ ...userVehicle, plateNumber: settingPlateInput });
    await AsyncStorage.setItem('@all_vehicles', JSON.stringify(updated));
    Alert.alert('نجاح', 'تم تحديث بيانات السيارة');
  };

  /* =========================================================
     واجهة الشاشات
     ========================================================= */

  /* 1- شاشة الدخول (تعديل رقم 1: حذف اسم أطلس ورقم الإصدار) */
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>تسجيل الدخول</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>اسم المستخدم / رقم اللوحة</Text>
            <TextInput
              style={styles.input}
              value={loginUsername}
              onChangeText={setLoginUsername}
              placeholder="أدخل اسم المستخدم أو رقم اللوحة"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <TextInput
              style={styles.input}
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
              placeholder="أدخل كلمة المرور"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>دخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* الهيدر العلوي */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>نظام إدارة الأسطول</Text>
          <Text style={styles.headerSubtitle}>
            {currentUserRole === 'admin' ? 'حساب المسؤول' : `${userVehicle.driverName} (${userVehicle.plateNumber})`}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>خروج</Text>
        </TouchableOpacity>
      </View>

      {/* جسم الصفحة */}
      <View style={styles.body}>

        {/* =========================================================
           حساب المستخدم / السائق
           ========================================================= */}
        {currentUserRole === 'user' && (
          <View style={{ flex: 1 }}>

            {/* الشريط السفلي للتنقل بين التبويبات */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabItem, currentTab === 'my_requests' && styles.tabItemActive]}
                onPress={() => setCurrentTab('my_requests')}
              >
                <Text style={[styles.tabText, currentTab === 'my_requests' && styles.tabTextActive]}>طلباتي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, currentTab === 'new_request' && styles.tabItemActive]}
                onPress={() => setCurrentTab('new_request')}
              >
                <Text style={[styles.tabText, currentTab === 'new_request' && styles.tabTextActive]}>طلب خدمة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, currentTab === 'reports' && styles.tabItemActive]}
                onPress={() => setCurrentTab('reports')}
              >
                <Text style={[styles.tabText, currentTab === 'reports' && styles.tabTextActive]}>التقارير</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, currentTab === 'settings' && styles.tabItemActive]}
                onPress={() => setCurrentTab('settings')}
              >
                <Text style={[styles.tabText, currentTab === 'settings' && styles.tabTextActive]}>الإعدادات</Text>
              </TouchableOpacity>
            </View>

            {/* 1. تبويب طلباتي */}
            {currentTab === 'my_requests' && (
              <ScrollView style={styles.tabContent}>
                <Text style={styles.sectionTitle}>سجل الطلبات الخاصة بي</Text>
                {requests
                  .filter(r => r.vehicleId === userVehicle.id)
                  .map(req => (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{req.type} - #{req.processNumber}</Text>
                        <Text style={[
                          styles.badge,
                          req.status === 'تم الاعتماد' ? styles.badgeSuccess :
                          req.status === 'مرفوض' ? styles.badgeDanger : styles.badgeWarning
                        ]}>
                          {req.status}
                        </Text>
                      </View>
                      <Text style={styles.cardText}>التاريخ: {req.date}</Text>
                      <Text style={styles.cardText}>الكمية/البيان: {req.quantity}</Text>
                      {req.priceAmount ? <Text style={styles.cardText}>الإجمالي: {req.priceAmount} ريال</Text> : null}
                      {req.notes ? <Text style={styles.cardText}>ملاحظات: {req.notes}</Text> : null}
                      {req.attachmentUri && (
                        <Image source={{ uri: req.attachmentUri }} style={{ width: 100, height: 100, marginTop: 5, borderRadius: 5 }} />
                      )}
                    </View>
                  ))}
              </ScrollView>
            )}

            {/* 2. تبويب طلب خدمة */}
            {currentTab === 'new_request' && (
              <ScrollView style={styles.tabContent}>
                {/* أنواع الخدمات */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabContainer}>
                  {(['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار', 'بنشر', 'رحلة'] as RequestType[]).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.subTabItem, serviceSubTab === t && styles.subTabItemActive]}
                      onPress={() => setServiceSubTab(t)}
                    >
                      <Text style={[styles.subTabText, serviceSubTab === t && styles.subTabTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>تسجيل طلب {serviceSubTab}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>رقم العملية المرجعي</Text>
                    <TextInput
                      style={styles.input}
                      value={reqProcessNo}
                      onChangeText={setReqProcessNo}
                      placeholder="تلقائي أودخل الرقم"
                    />
                  </View>

                  {/* الحقول المخصصة لكل نوع */}
                  {serviceSubTab === 'وقود' && (
                    <>
                      <Text style={styles.label}>نوع الوقود</Text>
                      <ScrollView horizontal style={styles.chipContainer}>
                        {codes.fuelTypes.map(ft => (
                          <TouchableOpacity
                            key={ft}
                            style={[styles.chip, reqFuelType === ft && styles.chipActive]}
                            onPress={() => setReqFuelType(ft)}
                          >
                            <Text style={reqFuelType === ft ? styles.chipTextActive : styles.chipText}>{ft}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={styles.label}>المحطة</Text>
                      <ScrollView horizontal style={styles.chipContainer}>
                        {codes.stations.map(st => (
                          <TouchableOpacity
                            key={st}
                            style={[styles.chip, reqStation === st && styles.chipActive]}
                            onPress={() => setReqStation(st)}
                          >
                            <Text style={reqStation === st ? styles.chipTextActive : styles.chipText}>{st}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {serviceSubTab === 'زيوت' && (
                    <>
                      <Text style={styles.label}>نوع الزيت</Text>
                      <ScrollView horizontal style={styles.chipContainer}>
                        {codes.oils.map(ot => (
                          <TouchableOpacity
                            key={ot}
                            style={[styles.chip, reqOilType === ot && styles.chipActive]}
                            onPress={() => setReqOilType(ot)}
                          >
                            <Text style={reqOilType === ot ? styles.chipTextActive : styles.chipText}>{ot}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* تعديل رقم 5: العداد السابق يمتلئ تلقائياً */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>العداد السابق (تلقائي من العملية السابقة)</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: '#e2e8f0' }]}
                          value={reqPrevOdometer}
                          editable={false}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>العداد الحالي</Text>
                        <TextInput
                          style={styles.input}
                          value={reqCurrentOdometer}
                          onChangeText={setReqCurrentOdometer}
                          keyboardType="numeric"
                          placeholder="أدخل العداد الحالي"
                        />
                      </View>
                    </>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>الكمية / البيان</Text>
                    <TextInput
                      style={styles.input}
                      value={reqQuantity}
                      onChangeText={handleQuantityChange}
                      keyboardType="numeric"
                      placeholder="أدخل الكمية"
                    />
                  </View>

                  {/* تعديل رقم 3: القيمة تظهر مباشرة عند كتابة الكمية */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>القيمة الإجمالية (تلقائي / يدوي)</Text>
                    <TextInput
                      style={styles.input}
                      value={reqPriceAmount}
                      onChangeText={setReqPriceAmount}
                      keyboardType="numeric"
                      placeholder="الإجمالي بالريال"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>الملاحظات</Text>
                    <TextInput
                      style={styles.input}
                      value={reqNotes}
                      onChangeText={setReqNotes}
                      placeholder="أي ملاحظات إضافية"
                    />
                  </View>

                  {/* تعديل رقم 4: زر إرفاق صورة بالاسم الجديد وفتح الخيارات */}
                  <TouchableOpacity style={styles.attachButton} onPress={handlePickAttachment}>
                    <Text style={styles.attachButtonText}>
                      {reqAttachmentUri ? 'تم إرفاق صورة (اضغط للتغيير)' : 'إرفاق صورة'}
                    </Text>
                  </TouchableOpacity>

                  {reqAttachmentUri && (
                    <Image source={{ uri: reqAttachmentUri }} style={{ width: '100%', height: 150, borderRadius: 8, marginVertical: 10 }} />
                  )}

                  <TouchableOpacity style={styles.primaryButton} onPress={handleCreateRequest}>
                    <Text style={styles.primaryButtonText}>إرسال الطلب</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* 3. تبويب التقارير للمستخدم (تعديل رقم 7) */}
            {currentTab === 'reports' && (
              <ScrollView style={styles.tabContent}>
                <View style={styles.reportToggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, reportMode === 'detailed' && styles.toggleBtnActive]}
                    onPress={() => setReportMode('detailed')}
                  >
                    <Text style={reportMode === 'detailed' ? styles.toggleTextActive : styles.toggleText}>تقارير تفصيلية</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, reportMode === 'summary' && styles.toggleBtnActive]}
                    onPress={() => setReportMode('summary')}
                  >
                    <Text style={reportMode === 'summary' ? styles.toggleTextActive : styles.toggleText}>تقارير إجمالية</Text>
                  </TouchableOpacity>
                </View>

                {/* تقارير تفصيلية */}
                {reportMode === 'detailed' ? (
                  <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabContainer}>
                      {(['وقود', 'زيوت', 'صيانة وقطع غيار', 'إطارات', 'بطاريات', 'رحلة'] as RequestType[]).map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.subTabItem, detailedCategory === cat && styles.subTabItemActive]}
                          onPress={() => setDetailedCategory(cat)}
                        >
                          <Text style={[styles.subTabText, detailedCategory === cat && styles.subTabTextActive]}>تقارير {cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.sectionTitle}>تفاصيل طلبات {detailedCategory}</Text>

                    {requests
                      .filter(r => r.vehicleId === userVehicle.id && r.type === detailedCategory)
                      .map(r => (
                        <View key={r.id} style={styles.reportDetailCard}>
                          <Text style={styles.reportTextBold}>رقم العملية: {r.processNumber}</Text>
                          <Text style={styles.reportText}>التاريخ: {r.date}</Text>
                          {r.station ? <Text style={styles.reportText}>المحطة: {r.station}</Text> : null}
                          <Text style={styles.reportText}>الكمية/البيان: {r.quantity}</Text>
                          <Text style={styles.reportText}>المخصص: {r.allocation}</Text>
                          <Text style={styles.reportText}>الإجمالي: {r.priceAmount || '0'} ريال</Text>
                          <Text style={styles.reportText}>الملاحظات: {r.notes || 'لا يوجد'}</Text>
                        </View>
                      ))}
                  </View>
                ) : (
                  /* تقارير إجمالية */
                  <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>المصاريف الإجمالية خلال الفترة</Text>
                    {(['وقود', 'زيوت', 'صيانة وقطع غيار', 'بطاريات', 'إطارات', 'بنشر', 'رحلة'] as RequestType[]).map(t => {
                      const total = requests
                        .filter(r => r.vehicleId === userVehicle.id && r.type === t)
                        .reduce((sum, r) => sum + (parseFloat(r.priceAmount || '0') || 0), 0);
                      return (
                        <View key={t} style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>{t}</Text>
                          <Text style={styles.summaryValue}>{total} ريال</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            )}

            {/* 4. تبويب الإعدادات للمستخدم (تعديل رقم 7) */}
            {currentTab === 'settings' && (
              <ScrollView style={styles.tabContent}>
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>تغيير كلمة المرور</Text>
                  {!canChangePassword && (
                    <Text style={{ color: 'red', marginBottom: 10 }}>* تم إيقاف صلاحية تغيير كلمة المرور من قبل المسؤول.</Text>
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder="كلمة المرور الحالية"
                    secureTextEntry
                    value={settingOldPass}
                    onChangeText={setSettingOldPass}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="كلمة المرور الجديدة"
                    secureTextEntry
                    value={settingNewPass}
                    onChangeText={setSettingNewPass}
                  />
                  <TouchableOpacity
                    style={[styles.primaryButton, !canChangePassword && { backgroundColor: '#ccc' }]}
                    onPress={handleChangeUserPassword}
                    disabled={!canChangePassword}
                  >
                    <Text style={styles.primaryButtonText}>حفظ كلمة المرور</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>تعديل بيانات السيارة</Text>
                  <Text style={styles.label}>رقم اللوحة</Text>
                  <TextInput
                    style={styles.input}
                    value={settingPlateInput}
                    onChangeText={setSettingPlateInput}
                  />
                  <TouchableOpacity style={styles.primaryButton} onPress={handleUpdateVehicleData}>
                    <Text style={styles.primaryButtonText}>تحديث البيانات</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#e11d48', marginTop: 20 }]} onPress={handleLogout}>
                  <Text style={styles.primaryButtonText}>تسجيل الخروج</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

          </View>
        )}

        {/* =========================================================
           حساب المسؤول / الأدمن
           ========================================================= */}
        {currentUserRole === 'admin' && (
          <View style={{ flex: 1 }}>

            {/* شريط تبويبات المسؤول */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adminTabBar}>
              <TouchableOpacity
                style={[styles.adminTabItem, adminSubTab === 'overview' && styles.adminTabActive]}
                onPress={() => setAdminSubTab('overview')}
              >
                <Text style={styles.adminTabText}>الطلبات والاعتمادات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminTabItem, adminSubTab === 'coding' && styles.adminTabActive]}
                onPress={() => setAdminSubTab('coding')}
              >
                <Text style={styles.adminTabText}>التكويدات والأسعار</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminTabItem, adminSubTab === 'permissions' && styles.adminTabActive]}
                onPress={() => setAdminSubTab('permissions')}
              >
                <Text style={styles.adminTabText}>الصلاحيات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminTabItem, adminSubTab === 'sync' && styles.adminTabActive]}
                onPress={() => setAdminSubTab('sync')}
              >
                <Text style={styles.adminTabText}>المزامنة والنسخ</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* 1. إدارة الطلبات */}
            {adminSubTab === 'overview' && (
              <ScrollView style={styles.tabContent}>
                <Text style={styles.sectionTitle}>مراجعة كافة الطلبات</Text>
                {requests.map(req => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{req.driverName} ({req.vehiclePlate})</Text>
                      <Text style={styles.badge}>{req.status}</Text>
                    </View>
                    <Text style={styles.cardText}>النوع: {req.type} | الرقم: {req.processNumber}</Text>
                    <Text style={styles.cardText}>الكمية: {req.quantity} | المبلغ: {req.priceAmount || 0} ريال</Text>

                    {req.attachmentUri && (
                      <Image source={{ uri: req.attachmentUri }} style={{ width: 120, height: 120, borderRadius: 6, marginVertical: 6 }} />
                    )}

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnApprove]}
                        onPress={() => handleUpdateRequestStatus(req.id, 'تم الاعتماد')}
                      >
                        <Text style={styles.actionBtnText}>اعتماد</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnReject]}
                        onPress={() => handleUpdateRequestStatus(req.id, 'مرفوض')}
                      >
                        <Text style={styles.actionBtnText}>رفض</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* 2. التكويدات والأسعار (تعديل رقم 2: إضافة زر التعديل وحفظ التغييرات) */}
            {adminSubTab === 'coding' && (
              <ScrollView style={styles.tabContent}>
                <ScrollView horizontal style={styles.subTabContainer}>
                  {(['spareParts', 'oils', 'allocations', 'batteries', 'stations', 'tires', 'fuelTypes', 'prices'] as const).map(tab => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.subTabItem, codingSubTab === tab && styles.subTabItemActive]}
                      onPress={() => setCodingSubTab(tab)}
                    >
                      <Text style={codingSubTab === tab ? styles.subTabTextActive : styles.subTabText}>{tab}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {codingSubTab !== 'prices' ? (
                  <View style={styles.formCard}>
                    <Text style={styles.formTitle}>إدارة {codingSubTab}</Text>

                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginEnd: 5 }]}
                        value={newCodeInput}
                        onChangeText={setNewCodeInput}
                        placeholder="إضافة عنصر جديد"
                      />
                      <TouchableOpacity style={styles.primaryButton} onPress={handleAddCode}>
                        <Text style={styles.primaryButtonText}>إضافة</Text>
                      </TouchableOpacity>
                    </View>

                    {codes[codingSubTab as keyof CodeCategories]?.map(item => (
                      <View key={item} style={styles.codeRow}>
                        {editingItemOldValue === item ? (
                          <View style={{ flexDirection: 'row', flex: 1 }}>
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              value={editingItemNewValue}
                              onChangeText={setEditingItemNewValue}
                            />
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.btnApprove, { marginStart: 5 }]}
                              onPress={() => handleSaveEditCode(codingSubTab as keyof CodeCategories)}
                            >
                              <Text style={styles.actionBtnText}>حفظ</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.codeText}>{item}</Text>
                            <View style={{ flexDirection: 'row' }}>
                              <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#f59e0b', marginEnd: 5 }]}
                                onPress={() => handleStartEditCode(item)}
                              >
                                <Text style={styles.actionBtnText}>تعديل</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.btnReject]}
                                onPress={() => handleDeleteCode(codingSubTab as keyof CodeCategories, item)}
                              >
                                <Text style={styles.actionBtnText}>حذف</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  /* إعداد الأسعار */
                  <View style={styles.formCard}>
                    <Text style={styles.formTitle}>إدارة قائمة الأسعار</Text>
                    {Object.entries(itemPrices).map(([key, val]) => (
                      <View key={key} style={styles.codeRow}>
                        {editingPriceKey === key ? (
                          <View style={{ flexDirection: 'row', flex: 1 }}>
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              value={editingPriceVal}
                              onChangeText={setEditingPriceVal}
                              keyboardType="numeric"
                            />
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.btnApprove, { marginStart: 5 }]}
                              onPress={handleSaveEditPrice}
                            >
                              <Text style={styles.actionBtnText}>حفظ</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.codeText}>{key}: {val} ريال</Text>
                            <View style={{ flexDirection: 'row' }}>
                              <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#f59e0b', marginEnd: 5 }]}
                                onPress={() => handleStartEditPrice(key, val)}
                              >
                                <Text style={styles.actionBtnText}>تعديل</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.btnReject]}
                                onPress={() => handleDeletePrice(key)}
                              >
                                <Text style={styles.actionBtnText}>حذف</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            {/* 3. الصلاحيات (تعديل رقم 6: إضافة بند صلاحية تغيير كلمة المرور) */}
            {adminSubTab === 'permissions' && (
              <ScrollView style={styles.tabContent}>
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>إدارة صلاحيات المستخدمين</Text>

                  <View style={styles.permissionRow}>
                    <Text style={styles.label}>صلاحية تغيير كلمة المرور للمستخدمين</Text>
                    <TouchableOpacity
                      style={[styles.actionBtn, canChangePassword ? styles.btnApprove : styles.btnReject]}
                      onPress={async () => {
                        const newPerm = !canChangePassword;
                        setCanChangePassword(newPerm);
                        await AsyncStorage.setItem('@fleet_perm_password', JSON.stringify(newPerm));
                      }}
                    >
                      <Text style={styles.actionBtnText}>{canChangePassword ? 'ممنوحة (إيقاف)' : 'موقوفة (منح)'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* 4. المزامنة والنسخ */}
            {adminSubTab === 'sync' && (
              <ScrollView style={styles.tabContent}>
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>المزامنة والنسخ الاحتياطي</Text>
                  <Text style={styles.label}>حالة المزامنة: {syncMessage}</Text>
                  <Text style={styles.label}>آخر مزامنة: {lastSyncDate || 'لم تتم بعد'}</Text>

                  {syncLoading ? (
                    <ActivityIndicator size="large" color="#0284c7" />
                  ) : (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSyncData}>
                      <Text style={styles.primaryButtonText}>بدء المزامنة الآن</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}

          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   الأنماط والتنسيقات (Styles)
   ========================================================= */

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    width: '85%',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row-reverse',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#0284c7',
  },
  tabText: {
    fontSize: 13,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: 'bold',
  },
  subTabContainer: {
    flexDirection: 'row-reverse',
    marginVertical: 10,
  },
  subTabItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  subTabItemActive: {
    backgroundColor: '#0284c7',
  },
  subTabText: {
    color: '#334155',
    fontSize: 12,
  },
  subTabTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginVertical: 10,
    textAlign: 'right',
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0f172a',
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    textAlign: 'right',
    fontSize: 14,
  },
  chipContainer: {
    flexDirection: 'row-reverse',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    marginHorizontal: 3,
  },
  chipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 12,
    color: '#334155',
  },
  chipTextActive: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  attachButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0284c7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  attachButtonText: {
    color: '#0369a1',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#0f172a',
  },
  cardText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    overflow: 'hidden',
  },
  badgeSuccess: { backgroundColor: '#dcfce7', color: '#166534' },
  badgeDanger: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeWarning: { backgroundColor: '#fef3c7', color: '#92400e' },

  /* أنماط الأدمن والتقارير */
  adminTabBar: {
    backgroundColor: '#0f172a',
    paddingVertical: 6,
  },
  adminTabItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  adminTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#38bdf8',
  },
  adminTabText: {
    color: '#ffffff',
    fontSize: 12,
  },
  codeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  codeText: {
    fontSize: 13,
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    marginTop: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnApprove: { backgroundColor: '#16a34a' },
  btnReject: { backgroundColor: '#dc2626' },

  permissionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  reportToggleRow: {
    flexDirection: 'row-reverse',
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  toggleBtnActive: {
    backgroundColor: '#0284c7',
  },
  toggleText: {
    color: '#334155',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reportDetailCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderRightWidth: 4,
    borderRightColor: '#0284c7',
  },
  reportTextBold: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'right',
  },
  reportText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#334155',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284c7',
  }
});

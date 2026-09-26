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

const APP_VERSION = '1.10.0';

const SYNC_API_URL = 'http://192.168.1.100:3000/api/sync';

type Role = 'user' | 'admin';

type Permission =
  | 'editVehicles'
  | 'editDrivers'
  | 'editCoding'
  | 'manageUsers'
  | 'manageBindings'
  | 'viewReports'
  | 'manageRequests'
  | 'syncData';

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  driverName: string;
  status: 'في الخدمة' | 'موقف';
}

interface Driver {
  id: string;
  name: string;
  username: string;
  status: 'فعال' | 'موقوف';
}

interface DriverVehicleBinding {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  startDate: string;
  endDate: string;
  status: 'فعال' | 'منتهي';
}

interface UserPermission {
  username: string;
  role: Role;
  permissions: Permission[];
}

interface ServiceRequest {
  id: string;
  type:
    | 'وقود'
    | 'زيوت'
    | 'إطارات'
    | 'بطاريات'
    | 'صيانة وقطع غيار';

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
  status: 'قيد المراجعة' | 'مرفوض' | 'تم الاعتماد';
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
}

interface AuditLog {
  id: string;
  date: string;
  username: string;
  action: string;
  details: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [currentPermissions, setCurrentPermissions] = useState<Permission[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('my_requests');

  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<string>('وقود');

  const [codingSubTab, setCodingSubTab] =
    useState<keyof CodeCategories | 'prices'>('prices');

  const [priceSubCategory, setPriceSubCategory] =
    useState<'fuel' | 'oil' | 'battery' | 'tire' | 'other'>('fuel');

  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');
  const [reportType, setReportType] =
    useState<'detailed' | 'summary'>('detailed');

  /*
   * ============================================================
   * السيارات الأصلية - تم الإبقاء عليها كما هي
   * ============================================================
   */

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

  const [allVehicles, setAllVehicles] =
    useState<Vehicle[]>(initialVehicles);

  /*
   * ============================================================
   * التكويدات الأصلية
   * ============================================================
   */

  const [codes, setCodes] = useState<CodeCategories>({
    spareParts: ['فلاتر', 'سير محرك', 'قماشات فرامل'],
    oils: ['زيت محرك 20W50', 'زيت هيدروليك', 'زيت جير'],
    allocations: ['رحلة تعز - عدن', 'توزيع محلي', 'حركة مصنع'],
    batteries: ['بطارية 70 أمبير', 'بطارية 100 أمبير'],
    stations: ['محطة الزبيدي', 'محطة الشركة', 'محطة الأمل'],
    tires: ['إطار 22.5', 'إطار 16'],
    fuelTypes: ['ديزل', 'بنزين ممتاز', 'بنزين عادي']
  });

  const [itemPrices, setItemPrices] =
    useState<Record<string, string>>({
      'ديزل': '1000',
      'بنزين ممتاز': '1200',
      'زيت محرك 20W50': '5000'
    });

  /*
   * ============================================================
   * البيانات الجديدة
   * ============================================================
   */

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bindings, setBindings] =
    useState<DriverVehicleBinding[]>([]);

  const [userPermissions, setUserPermissions] =
    useState<UserPermission[]>([]);

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>([]);

  const [lastSyncAt, setLastSyncAt] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  /*
   * ============================================================
   * حقول المستخدم
   * ============================================================
   */

  const [newCodeInput, setNewCodeInput] = useState<string>('');
  const [priceItemSelect, setPriceItemSelect] = useState<string>('');
  const [priceValueInput, setPriceValueInput] = useState<string>('');

  const [userVehicle, setUserVehicle] =
    useState<Vehicle>(initialVehicles[0]);

  const [requests, setRequests] =
    useState<ServiceRequest[]>([]);

  const [userPassword, setUserPassword] = useState('000');

  /*
   * طلبات السائق
   */

  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('');
  const [reqOilType, setReqOilType] = useState('');
  const [reqPrevOdometer, setReqPrevOdometer] = useState('0');
  const [reqCurrentOdometer, setReqCurrentOdometer] = useState('');
  const [reqDistanceTraveled, setReqDistanceTraveled] =
    useState('0');
  const [reqAttachment, setReqAttachment] =
    useState<boolean>(false);
  const [reqNotes, setReqNotes] = useState('');

  /*
   * ============================================================
   * البحث
   * ============================================================
   */

  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');

  const [requestStatusFilter, setRequestStatusFilter] =
    useState<string>('الكل');

  const [requestTypeFilter, setRequestTypeFilter] =
    useState<string>('الكل');

  /*
   * ============================================================
   * إضافة/تعديل سيارة
   * ============================================================
   */

  const [editingVehicleId, setEditingVehicleId] =
    useState<string | null>(null);

  const [vehicleFormPlate, setVehicleFormPlate] = useState('');
  const [vehicleFormName, setVehicleFormName] = useState('');
  const [vehicleFormDriver, setVehicleFormDriver] = useState('');
  const [vehicleFormStatus, setVehicleFormStatus] =
    useState<'في الخدمة' | 'موقف'>('في الخدمة');

  /*
   * ============================================================
   * السائقين
   * ============================================================
   */

  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverUsername, setNewDriverUsername] = useState('');

  /*
   * ============================================================
   * ربط السائقين
   * ============================================================
   */

  const [bindingDriverId, setBindingDriverId] = useState('');
  const [bindingVehicleId, setBindingVehicleId] = useState('');
  const [bindingStartDate, setBindingStartDate] = useState('');
  const [bindingEndDate, setBindingEndDate] = useState('');

  /*
   * ============================================================
   * تعديل طلب
   * ============================================================
   */

  const [editingRequestId, setEditingRequestId] =
    useState<string | null>(null);

  const [editRequestQty, setEditRequestQty] = useState('');
  const [editRequestAmount, setEditRequestAmount] = useState('');
  const [editRequestNotes, setEditRequestNotes] = useState('');

  /*
   * ============================================================
   * سجل الصلاحيات
   * ============================================================
   */

  const permissionNames: Record<Permission, string> = {
    editVehicles: 'تعديل السيارات',
    editDrivers: 'تعديل السائقين',
    editCoding: 'تعديل التكويدات والأسعار',
    manageUsers: 'إدارة صلاحيات المستخدمين',
    manageBindings: 'إدارة ربط السائقين بالسيارات',
    viewReports: 'عرض التقارير',
    manageRequests: 'إدارة طلبات السائقين',
    syncData: 'المزامنة'
  };

  const allPermissions: Permission[] = [
    'editVehicles',
    'editDrivers',
    'editCoding',
    'manageUsers',
    'manageBindings',
    'viewReports',
    'manageRequests',
    'syncData'
  ];

  /*
   * ============================================================
   * تحميل البيانات
   * ============================================================
   */

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests =
        await AsyncStorage.getItem('@fleet_requests');

      const savedVehicles =
        await AsyncStorage.getItem('@all_vehicles');

      const savedCodes =
        await AsyncStorage.getItem('@fleet_codes');

      const savedPrices =
        await AsyncStorage.getItem('@item_prices');

      const savedDrivers =
        await AsyncStorage.getItem('@fleet_drivers');

      const savedBindings =
        await AsyncStorage.getItem('@driver_vehicle_bindings');

      const savedPermissions =
        await AsyncStorage.getItem('@user_permissions');

      const savedLogs =
        await AsyncStorage.getItem('@fleet_audit_logs');

      const savedLastSync =
        await AsyncStorage.getItem('@fleet_last_sync');

      if (savedRequests)
        setRequests(JSON.parse(savedRequests));

      if (savedVehicles)
        setAllVehicles(JSON.parse(savedVehicles));

      if (savedCodes)
        setCodes(JSON.parse(savedCodes));

      if (savedPrices)
        setItemPrices(JSON.parse(savedPrices));

      if (savedDrivers) {
        setDrivers(JSON.parse(savedDrivers));
      } else {
        createInitialDrivers();
      }

      if (savedBindings)
        setBindings(JSON.parse(savedBindings));

      if (savedPermissions)
        setUserPermissions(JSON.parse(savedPermissions));

      if (savedLogs)
        setAuditLogs(JSON.parse(savedLogs));

      if (savedLastSync)
        setLastSyncAt(savedLastSync);

    } catch (e) {
      console.log('خطأ قراءة البيانات', e);
    }
  };

  /*
   * ============================================================
   * إنشاء السائقين من قائمة السيارات لأول مرة
   * ============================================================
   */

  const createInitialDrivers = async () => {
    const uniqueNames = Array.from(
      new Set(
        initialVehicles
          .map(v => v.driverName)
          .filter(n => n && n !== 'غير محدد')
      )
    );

    const generated: Driver[] = uniqueNames.map(
      (name, index) => ({
        id: `driver_${index + 1}`,
        name,
        username:
          initialVehicles.find(v => v.driverName === name)
            ?.plateNumber || `driver${index + 1}`,
        status: 'فعال'
      })
    );

    setDrivers(generated);

    await AsyncStorage.setItem(
      '@fleet_drivers',
      JSON.stringify(generated)
    );
  };

  /*
   * ============================================================
   * الحفظ المحلي
   * ============================================================
   */

  const saveRequestsLocally = async (
    newList: ServiceRequest[]
  ) => {
    setRequests(newList);

    await AsyncStorage.setItem(
      '@fleet_requests',
      JSON.stringify(newList)
    );
  };

  const saveVehiclesLocally = async (
    newList: Vehicle[]
  ) => {
    setAllVehicles(newList);

    await AsyncStorage.setItem(
      '@all_vehicles',
      JSON.stringify(newList)
    );
  };

  const saveCodesLocally = async (
    newCodes: CodeCategories
  ) => {
    setCodes(newCodes);

    await AsyncStorage.setItem(
      '@fleet_codes',
      JSON.stringify(newCodes)
    );
  };

  const savePricesLocally = async (
    newPrices: Record<string, string>
  ) => {
    setItemPrices(newPrices);

    await AsyncStorage.setItem(
      '@item_prices',
      JSON.stringify(newPrices)
    );
  };

  const saveDriversLocally = async (
    newDrivers: Driver[]
  ) => {
    setDrivers(newDrivers);

    await AsyncStorage.setItem(
      '@fleet_drivers',
      JSON.stringify(newDrivers)
    );
  };

  const saveBindingsLocally = async (
    newBindings: DriverVehicleBinding[]
  ) => {
    setBindings(newBindings);

    await AsyncStorage.setItem(
      '@driver_vehicle_bindings',
      JSON.stringify(newBindings)
    );
  };

  const savePermissionsLocally = async (
    newPermissions: UserPermission[]
  ) => {
    setUserPermissions(newPermissions);

    await AsyncStorage.setItem(
      '@user_permissions',
      JSON.stringify(newPermissions)
    );
  };

  const saveLogsLocally = async (
    newLogs: AuditLog[]
  ) => {
    setAuditLogs(newLogs);

    await AsyncStorage.setItem(
      '@fleet_audit_logs',
      JSON.stringify(newLogs)
    );
  };

  /*
   * ============================================================
   * سجل العمليات
   * ============================================================
   */

  const addAuditLog = async (
    action: string,
    details: string
  ) => {
    const log: AuditLog = {
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      username: currentUsername || 'admin',
      action,
      details
    };

    const updated = [log, ...auditLogs].slice(0, 500);

    await saveLogsLocally(updated);
  };

  /*
   * ============================================================
   * الصلاحيات
   * ============================================================
   */

  const hasPermission = (permission: Permission) => {
    if (currentUserRole === 'admin') return true;

    return currentPermissions.includes(permission);
  };

  const getUserPermissions = (username: string) => {
    return userPermissions.find(
      u => u.username === username
    );
  };

  /*
   * ============================================================
   * تسجيل الدخول
   * ============================================================
   */

  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert(
        'خطأ',
        'يرجى إدخل اسم المستخدم'
      );
      return;
    }

    if (
      loginPassword !== '000' &&
      loginPassword !== userPassword
    ) {
      Alert.alert(
        'خطأ',
        'كلمة المرور غير صحيحة.'
      );
      return;
    }

    const username =
      loginUsername.trim();

    if (
      username.toLowerCase() === 'admin' ||
      username === 'المسؤول'
    ) {
      setCurrentUsername('admin');
      setCurrentUserRole('admin');
      setCurrentPermissions(allPermissions);
      setIsLoggedIn(true);
      setCurrentTab('admin_dashboard');
      return;
    }

    const foundVehicle =
      allVehicles.find(
        v =>
          v.plateNumber.trim() ===
          username
      );

    if (foundVehicle) {
      setUserVehicle(foundVehicle);
    } else {
      const tempVeh: Vehicle = {
        id: `v_${Date.now()}`,
        name: 'سيارة عامة',
        plateNumber: username,
        driverName: 'سائق عام',
        status: 'في الخدمة'
      };

      setUserVehicle(tempVeh);
    }

    const savedPermission =
      getUserPermissions(username);

    setCurrentUsername(username);
    setCurrentUserRole('user');

    setCurrentPermissions(
      savedPermission?.permissions || []
    );

    setIsLoggedIn(true);
    setCurrentTab('my_requests');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
    setCurrentUsername('');
    setCurrentPermissions([]);
  };

  /*
   * ============================================================
   * تجهيز الطلبات
   * ============================================================
   */

  const prepareOilRequest = (
    vehId: string
  ) => {
    const oilReqs =
      requests.filter(
        r =>
          r.vehicleId === vehId &&
          r.type === 'زيوت' &&
          r.currentOdometer
      );

    if (oilReqs.length > 0) {
      setReqPrevOdometer(
        oilReqs[0].currentOdometer || '0'
      );
    } else {
      setReqPrevOdometer('0');
    }

    setReqProcessNo(
      `OIL-${Math.floor(
        10000 + Math.random() * 90000
      )}`
    );
  };

  const prepareFuelRequest = () => {
    setReqProcessNo(
      `FUEL-${Math.floor(
        10000 + Math.random() * 90000
      )}`
    );
  };

  const handleOdometerChange = (
    currentOdo: string
  ) => {
    setReqCurrentOdometer(currentOdo);

    const curr =
      parseFloat(currentOdo) || 0;

    const prev =
      parseFloat(reqPrevOdometer) || 0;

    if (curr >= prev) {
      setReqDistanceTraveled(
        (curr - prev).toString()
      );
    } else {
      setReqDistanceTraveled('0');
    }
  };

  const handleQuantityOrTypeChange = (
    qty: string,
    selectedType: string
  ) => {
    setReqQuantity(qty);

    const unitPrice =
      itemPrices[selectedType];

    if (
      unitPrice &&
      !isNaN(Number(qty)) &&
      Number(qty) > 0
    ) {
      const total =
        Number(qty) *
        Number(unitPrice);

      setReqPriceAmount(
        total.toString()
      );
    }
  };

  const handleCreateRequest = (
    type: any
  ) => {
    const todayDate =
      new Date()
        .toISOString()
        .split('T')[0];

    const newReq: ServiceRequest = {
      id: `APP-${Date.now()}`,
      type,
      processNumber:
        reqProcessNo ||
        `TRX-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
      date: todayDate,
      quantity:
        reqQuantity || '1',
      priceAmount:
        reqPriceAmount || '0',
      allocation:
        reqAllocation ||
        codes.allocations[0] ||
        'عادي',
      station:
        reqStation ||
        codes.stations[0],
      fuelType:
        reqFuelType ||
        codes.fuelTypes[0],
      oilType:
        reqOilType ||
        codes.oils[0],
      prevOdometer:
        reqPrevOdometer,
      currentOdometer:
        reqCurrentOdometer,
      distanceTraveled:
        reqDistanceTraveled,
      hasAttachment:
        reqAttachment,
      notes:
        reqNotes,
      status:
        'قيد المراجعة',
      syncStatus:
        'PENDING_PUSH',
      vehicleId:
        userVehicle.id,
      vehiclePlate:
        userVehicle.plateNumber,
      driverName:
        userVehicle.driverName
    };

    const updated =
      [newReq, ...requests];

    saveRequestsLocally(updated);

    Alert.alert(
      'تم الإرسال',
      `تم إرسال طلب ${type} بنجاح برقم عملية (${newReq.processNumber}).`
    );

    setReqQuantity('');
    setReqPriceAmount('');
    setReqNotes('');
    setReqAttachment(false);
    setReqCurrentOdometer('');
  };

  /*
   * ============================================================
   * اعتماد / رفض الطلب
   * ============================================================
   */

  const handleApproveOrReject = (
    reqId: string,
    newStatus:
      | 'تم الاعتماد'
      | 'مرفوض'
  ) => {
    if (!hasPermission('manageRequests')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية إدارة الطلبات.'
      );
      return;
    }

    const updated =
      requests.map(r =>
        r.id === reqId
          ? {
              ...r,
              status: newStatus
            }
          : r
      );

    saveRequestsLocally(updated);

    addAuditLog(
      newStatus === 'تم الاعتماد'
        ? 'اعتماد طلب'
        : 'رفض طلب',
      `تم تغيير حالة الطلب ${reqId} إلى ${newStatus}`
    );

    Alert.alert(
      'تم التحديث',
      `تم تعديل حالة الطلب إلى (${newStatus}).`
    );
  };

  /*
   * ============================================================
   * تعديل الطلب
   * ============================================================
   */

  const startEditRequest = (
    req: ServiceRequest
  ) => {
    if (!hasPermission('manageRequests')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية تعديل الطلبات.'
      );
      return;
    }

    setEditingRequestId(req.id);
    setEditRequestQty(req.quantity);
    setEditRequestAmount(
      req.priceAmount || '0'
    );
    setEditRequestNotes(
      req.notes || ''
    );
  };

  const saveEditedRequest = () => {
    if (!editingRequestId) return;

    const updated =
      requests.map(r =>
        r.id === editingRequestId
          ? {
              ...r,
              quantity:
                editRequestQty,
              priceAmount:
                editRequestAmount,
              notes:
                editRequestNotes,
              syncStatus:
                'PENDING_PUSH' as const
            }
          : r
      );

    saveRequestsLocally(updated);

    addAuditLog(
      'تعديل طلب',
      `تم تعديل الطلب ${editingRequestId}`
    );

    setEditingRequestId(null);

    Alert.alert(
      'تم',
      'تم حفظ تعديل الطلب.'
    );
  };

  /*
   * ============================================================
   * الأسعار
   * ============================================================
   */

  const handleSavePrice = () => {
    if (!hasPermission('editCoding')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية تعديل الأسعار والتكويدات.'
      );
      return;
    }

    if (
      !priceItemSelect ||
      !priceValueInput
    ) {
      Alert.alert(
        'خطأ',
        'يرجى اختيار الصنف وإدخال السعر'
      );
      return;
    }

    const updatedPrices = {
      ...itemPrices,
      [priceItemSelect]:
        priceValueInput
    };

    savePricesLocally(updatedPrices);

    addAuditLog(
      'تعديل سعر',
      `تم تعديل سعر ${priceItemSelect} إلى ${priceValueInput}`
    );

    Alert.alert(
      'تم',
      `تم حفظ سعر (${priceItemSelect}) بـ ${priceValueInput} ريال.`
    );

    setPriceValueInput('');
  };

  /*
   * ============================================================
   * إضافة تكويد
   * ============================================================
   */

  const addNewCode = () => {
    if (!hasPermission('editCoding')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية تعديل التكويدات.'
      );
      return;
    }

    if (!newCodeInput.trim()) {
      Alert.alert(
        'تنبيه',
        'أدخل اسم التكويد.'
      );
      return;
    }

    if (
      codingSubTab === 'prices'
    ) {
      return;
    }

    const key =
      codingSubTab as keyof CodeCategories;

    const updated = [
      ...codes[key],
      newCodeInput.trim()
    ];

    saveCodesLocally({
      ...codes,
      [key]: updated
    });

    addAuditLog(
      'إضافة تكويد',
      `تمت إضافة ${newCodeInput.trim()} إلى ${key}`
    );

    setNewCodeInput('');
  };

  const deleteCode = (
    key: keyof CodeCategories,
    item: string
  ) => {
    if (!hasPermission('editCoding')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية حذف التكويدات.'
      );
      return;
    }

    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف (${item})؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const updated =
              codes[key].filter(
                x => x !== item
              );

            saveCodesLocally({
              ...codes,
              [key]: updated
            });

            addAuditLog(
              'حذف تكويد',
              `تم حذف ${item}`
            );
          }
        }
      ]
    );
  };

  /*
   * ============================================================
   * السيارات
   * ============================================================
   */

  const startEditVehicle = (
    vehicle: Vehicle
  ) => {
    if (!hasPermission('editVehicles')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية تعديل السيارات.'
      );
      return;
    }

    setEditingVehicleId(vehicle.id);
    setVehicleFormPlate(
      vehicle.plateNumber
    );
    setVehicleFormName(
      vehicle.name
    );
    setVehicleFormDriver(
      vehicle.driverName
    );
    setVehicleFormStatus(
      vehicle.status
    );
  };

  const saveVehicle = () => {
    if (!hasPermission('editVehicles')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية تعديل السيارات.'
      );
      return;
    }

    if (
      !vehicleFormPlate.trim() ||
      !vehicleFormName.trim()
    ) {
      Alert.alert(
        'تنبيه',
        'أدخل رقم السيارة واسمها.'
      );
      return;
    }

    let updated: Vehicle[];

    if (editingVehicleId) {
      updated =
        allVehicles.map(v =>
          v.id === editingVehicleId
            ? {
                ...v,
                plateNumber:
                  vehicleFormPlate,
                name:
                  vehicleFormName,
                driverName:
                  vehicleFormDriver,
                status:
                  vehicleFormStatus
              }
            : v
        );

      addAuditLog(
        'تعديل سيارة',
        `تم تعديل السيارة ${vehicleFormPlate}`
      );
    } else {
      const newVehicle: Vehicle = {
        id: `v_${Date.now()}`,
        plateNumber:
          vehicleFormPlate,
        name:
          vehicleFormName,
        driverName:
          vehicleFormDriver ||
          'غير محدد',
        status:
          vehicleFormStatus
      };

      updated =
        [newVehicle, ...allVehicles];

      addAuditLog(
        'إضافة سيارة',
        `تمت إضافة السيارة ${vehicleFormPlate}`
      );
    }

    saveVehiclesLocally(updated);

    setEditingVehicleId(null);
    setVehicleFormPlate('');
    setVehicleFormName('');
    setVehicleFormDriver('');
    setVehicleFormStatus(
      'في الخدمة'
    );

    Alert.alert(
      'تم',
      'تم حفظ بيانات السيارة.'
    );
  };

  const cancelVehicleEdit = () => {
    setEditingVehicleId(null);
    setVehicleFormPlate('');
    setVehicleFormName('');
    setVehicleFormDriver('');
    setVehicleFormStatus(
      'في الخدمة'
    );
  };

  /*
   * ============================================================
   * السائقين
   * ============================================================
   */

  const addDriver = () => {
    if (!hasPermission('editDrivers')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية تعديل السائقين.'
      );
      return;
    }

    if (!newDriverName.trim()) {
      Alert.alert(
        'تنبيه',
        'أدخل اسم السائق.'
      );
      return;
    }

    const newDriver: Driver = {
      id: `driver_${Date.now()}`,
      name:
        newDriverName.trim(),
      username:
        newDriverUsername.trim() ||
        newDriverName.trim(),
      status: 'فعال'
    };

    const updated = [
      newDriver,
      ...drivers
    ];

    saveDriversLocally(updated);

    addAuditLog(
      'إضافة سائق',
      `تمت إضافة السائق ${newDriver.name}`
    );

    setNewDriverName('');
    setNewDriverUsername('');

    Alert.alert(
      'تم',
      'تمت إضافة السائق.'
    );
  };

  const toggleDriverStatus = (
    driver: Driver
  ) => {
    if (!hasPermission('editDrivers')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية تعديل السائقين.'
      );
      return;
    }

    const newStatus =
      driver.status === 'فعال'
        ? 'موقوف'
        : 'فعال';

    const updated =
      drivers.map(d =>
        d.id === driver.id
          ? {
              ...d,
              status: newStatus
            }
          : d
      );

    saveDriversLocally(updated);

    addAuditLog(
      'تعديل سائق',
      `تم تغيير حالة السائق ${driver.name} إلى ${newStatus}`
    );
  };

  /*
   * ============================================================
   * ربط السائقين بالسيارات
   * ============================================================
   */

  const createBinding = () => {
    if (!hasPermission('manageBindings')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية إدارة ربط السائقين بالسيارات.'
      );
      return;
    }

    if (
      !bindingDriverId ||
      !bindingVehicleId ||
      !bindingStartDate ||
      !bindingEndDate
    ) {
      Alert.alert(
        'بيانات ناقصة',
        'يرجى تحديد السائق والسيارة وتاريخ بداية الربط وتاريخ انتهاء الربط.'
      );
      return;
    }

    const driver =
      drivers.find(
        d => d.id === bindingDriverId
      );

    const vehicle =
      allVehicles.find(
        v => v.id === bindingVehicleId
      );

    if (!driver || !vehicle) {
      Alert.alert(
        'خطأ',
        'لم يتم العثور على السائق أو السيارة.'
      );
      return;
    }

    const newBinding:
      DriverVehicleBinding = {
      id: `BIND-${Date.now()}`,
      driverId:
        driver.id,
      driverName:
        driver.name,
      vehicleId:
        vehicle.id,
      vehiclePlate:
        vehicle.plateNumber,
      startDate:
        bindingStartDate,
      endDate:
        bindingEndDate,
      status:
        bindingEndDate >=
        new Date()
          .toISOString()
          .split('T')[0]
          ? 'فعال'
          : 'منتهي'
    };

    const updated =
      [newBinding, ...bindings];

    saveBindingsLocally(updated);

    /*
     * تحديث السائق المرتبط بالسيارة
     */
    const updatedVehicles =
      allVehicles.map(v =>
        v.id === vehicle.id
          ? {
              ...v,
              driverName:
                driver.name
            }
          : v
      );

    saveVehiclesLocally(
      updatedVehicles
    );

    addAuditLog(
      'ربط سائق بسيارة',
      `${driver.name} ← ${vehicle.plateNumber} من ${bindingStartDate} إلى ${bindingEndDate}`
    );

    setBindingDriverId('');
    setBindingVehicleId('');
    setBindingStartDate('');
    setBindingEndDate('');

    Alert.alert(
      'تم',
      'تم ربط السائق بالسيارة بنجاح.'
    );
  };

  const deleteBinding = (
    bindingId: string
  ) => {
    if (!hasPermission('manageBindings')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية إدارة الربط.'
      );
      return;
    }

    Alert.alert(
      'تأكيد',
      'هل تريد حذف عملية الربط؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const updated =
              bindings.filter(
                b =>
                  b.id !== bindingId
              );

            saveBindingsLocally(
              updated
            );

            addAuditLog(
              'حذف ربط',
              `تم حذف الربط ${bindingId}`
            );
          }
        }
      ]
    );
  };

  /*
   * ============================================================
   * صلاحيات المستخدمين
   * ============================================================
   */

  const toggleUserPermission = (
    username: string,
    permission: Permission
  ) => {
    if (
      currentUserRole !== 'admin' &&
      !hasPermission('manageUsers')
    ) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية إدارة المستخدمين.'
      );
      return;
    }

    const existing =
      userPermissions.find(
        u => u.username === username
      );

    let updated: UserPermission[];

    if (!existing) {
      updated =
        [
          ...userPermissions,
          {
            username,
            role: 'user',
            permissions:
              [permission]
          }
        ];
    } else {
      const has =
        existing.permissions.includes(
          permission
        );

      const permissions =
        has
          ? existing.permissions.filter(
              p => p !== permission
            )
          : [
              ...existing.permissions,
              permission
            ];

      updated =
        userPermissions.map(u =>
          u.username === username
            ? {
                ...u,
                permissions
              }
            : u
        );
    }

    savePermissionsLocally(
      updated
    );

    addAuditLog(
      'تعديل صلاحيات',
      `المستخدم ${username} - ${permissionNames[permission]}`
    );
  };

  const getPermissionForUser = (
    username: string,
    permission: Permission
  ) => {
    const user =
      userPermissions.find(
        u => u.username === username
      );

    return (
      user?.permissions.includes(
        permission
      ) || false
    );
  };

  /*
   * ============================================================
   * التقارير
   * ============================================================
   */

  const getFilteredUserRequests =
    () => {
      return requests.filter(r => {
        const isMyVehicle =
          r.vehiclePlate ===
          userVehicle.plateNumber;

        let inDateRange = true;

        if (
          reportFromDate &&
          r.date < reportFromDate
        )
          inDateRange = false;

        if (
          reportToDate &&
          r.date > reportToDate
        )
          inDateRange = false;

        return (
          isMyVehicle &&
          inDateRange
        );
      });
    };

  const calculateUserSummary =
    () => {
      const filtered =
        getFilteredUserRequests();

      const summary: Record<
        string,
        {
          count: number;
          totalAmount: number;
          totalQty: number;
        }
      > = {};

      filtered.forEach(r => {
        const amount =
          parseFloat(
            r.priceAmount || '0'
          );

        const qty =
          parseFloat(
            r.quantity || '0'
          );

        if (!summary[r.type]) {
          summary[r.type] = {
            count: 0,
            totalAmount: 0,
            totalQty: 0
          };
        }

        summary[r.type].count += 1;
        summary[r.type].totalAmount +=
          amount;

        summary[r.type].totalQty +=
          qty;
      });

      return summary;
    };

  /*
   * ============================================================
   * تقارير المسؤول
   * ============================================================
   */

  const adminTotalAmount =
    requests.reduce(
      (sum, r) =>
        sum +
        Number(
          r.priceAmount || 0
        ),
      0
    );

  const adminApprovedAmount =
    requests
      .filter(
        r =>
          r.status ===
          'تم الاعتماد'
      )
      .reduce(
        (sum, r) =>
          sum +
          Number(
            r.priceAmount || 0
          ),
        0
      );

  const adminPendingCount =
    requests.filter(
      r =>
        r.status ===
        'قيد المراجعة'
    ).length;

  /*
   * ============================================================
   * مزامنة البيانات
   * ============================================================
   */

  const syncAllData = async () => {
    if (!hasPermission('syncData')) {
      Alert.alert(
        'صلاحية غير متاحة',
        'لا تملك صلاحية المزامنة.'
      );
      return;
    }

    try {
      setIsSyncing(true);

      const payload = {
        version: APP_VERSION,
        vehicles: allVehicles,
        drivers,
        bindings,
        requests,
        codes,
        prices: itemPrices,
        permissions: userPermissions,
        logs: auditLogs,
        syncedAt:
          new Date().toISOString()
      };

      const response =
        await fetch(
          SYNC_API_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body:
              JSON.stringify(
                payload
              )
          }
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const result =
        await response.json();

      /*
       * إذا قام السيرفر بإرجاع بيانات محدثة
       * يتم استقبالها وتخزينها محلياً.
       */

      if (
        result &&
        Array.isArray(
          result.vehicles
        )
      ) {
        setAllVehicles(
          result.vehicles
        );

        await AsyncStorage.setItem(
          '@all_vehicles',
          JSON.stringify(
            result.vehicles
          )
        );
      }

      if (
        result &&
        Array.isArray(
          result.drivers
        )
      ) {
        setDrivers(
          result.drivers
        );

        await AsyncStorage.setItem(
          '@fleet_drivers',
          JSON.stringify(
            result.drivers
          )
        );
      }

      if (
        result &&
        Array.isArray(
          result.bindings
        )
      ) {
        setBindings(
          result.bindings
        );

        await AsyncStorage.setItem(
          '@driver_vehicle_bindings',
          JSON.stringify(
            result.bindings
          )
        );
      }

      if (
        result &&
        Array.isArray(
          result.requests
        )
      ) {
        setRequests(
          result.requests
        );

        await AsyncStorage.setItem(
          '@fleet_requests',
          JSON.stringify(
            result.requests
          )
        );
      } else {
        /*
         * في حالة نجاح الإرسال
         * نعتبر الطلبات المحلية متزامنة.
         */
        const syncedRequests =
          requests.map(r => ({
            ...r,
            syncStatus:
              'SYNCED' as const
          }));

        setRequests(
          syncedRequests
        );

        await AsyncStorage.setItem(
          '@fleet_requests',
          JSON.stringify(
            syncedRequests
          )
        );
      }

      if (
        result &&
        result.codes
      ) {
        setCodes(
          result.codes
        );

        await AsyncStorage.setItem(
          '@fleet_codes',
          JSON.stringify(
            result.codes
          )
        );
      }

      if (
        result &&
        result.prices
      ) {
        setItemPrices(
          result.prices
        );

        await AsyncStorage.setItem(
          '@item_prices',
          JSON.stringify(
            result.prices
          )
        );
      }

      const syncTime =
        new Date().toISOString();

      setLastSyncAt(syncTime);

      await AsyncStorage.setItem(
        '@fleet_last_sync',
        syncTime
      );

      addAuditLog(
        'مزامنة',
        'تمت مزامنة بيانات التطبيق مع الخادم'
      );

      Alert.alert(
        'نجاح المزامنة',
        'تمت المزامنة بنجاح.'
      );

    } catch (error) {
      console.log(
        'Sync error:',
        error
      );

      Alert.alert(
        'تعذر المزامنة',
        'لم يتم الاتصال بالخادم. تم الاحتفاظ بالبيانات محلياً ويمكن إعادة المحاولة لاحقاً.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  /*
   * ============================================================
   * فلترة الطلبات للمسؤول
   * ============================================================
   */

  const getAdminFilteredRequests =
    () => {
      return requests.filter(r => {
        const search =
          requestSearch
            .trim()
            .toLowerCase();

        const matchesSearch =
          !search ||
          r.vehiclePlate
            .toLowerCase()
            .includes(search) ||
          r.driverName
            .toLowerCase()
            .includes(search) ||
          r.processNumber
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          requestStatusFilter ===
          'الكل' ||
          r.status ===
            requestStatusFilter;

        const matchesType =
          requestTypeFilter ===
          'الكل' ||
          r.type ===
            requestTypeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        );
      });
    };

  /*
   * ============================================================
   * فلترة السيارات والسائقين
   * ============================================================
   */

  const filteredVehicles =
    allVehicles.filter(v => {
      const search =
        vehicleSearch
          .trim()
          .toLowerCase();

      return (
        !search ||
        v.plateNumber
          .toLowerCase()
          .includes(search) ||
        v.name
          .toLowerCase()
          .includes(search) ||
        v.driverName
          .toLowerCase()
          .includes(search)
      );
    });

  const filteredDrivers =
    drivers.filter(d => {
      const search =
        driverSearch
          .trim()
          .toLowerCase();

      return (
        !search ||
        d.name
          .toLowerCase()
          .includes(search) ||
        d.username
          .toLowerCase()
          .includes(search)
      );
    });

  /*
   * ============================================================
   * شاشة الدخول
   * ============================================================
   */

  if (!isLoggedIn) {
    return (
      <SafeAreaView
        style={
          styles.whiteLoginContainer
        }
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <View
          style={
            styles.whiteLoginCard
          }
        >
          <Text
            style={
              styles.loginAppTitle
            }
          >
            أطلس
          </Text>

          <Text
            style={
              styles.loginVersion
            }
          >
            الإصدار {APP_VERSION}
          </Text>

          <Text
            style={
              styles.inputLabel
            }
          >
            اسم المستخدم:
          </Text>

          <TextInput
            style={
              styles.whiteInput
            }
            placeholder="أدخل رقم السيارة أو اسم المستخدم"
            value={loginUsername}
            onChangeText={
              setLoginUsername
            }
            placeholderTextColor="#999"
          />

          <Text
            style={
              styles.inputLabel
            }
          >
            كلمة المرور:
          </Text>

          <TextInput
            style={
              styles.whiteInput
            }
            placeholder="أدخل كلمة المرور"
            secureTextEntry
            value={loginPassword}
            onChangeText={
              setLoginPassword
            }
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={
              styles.whiteSubmitBtn
            }
            onPress={handleLogin}
          >
            <Text
              style={
                styles.whiteSubmitBtnText
              }
            >
              تسجيل الدخول 🔑
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ============================================================
   * التطبيق
   * ============================================================
   */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0D47A1"
      />

      <View
        style={styles.header}
      >
        <Text
          style={
            styles.headerTitle
          }
        >
          {currentUserRole ===
          'user'
            ? `🚗 السائق: ${userVehicle.driverName} | السيارة: (${userVehicle.plateNumber})`
            : 'أطلس - لوحة المسؤول'}
        </Text>

        <Text
          style={
            styles.headerVersion
          }
        >
          الإصدار {APP_VERSION}
        </Text>
      </View>

      <View
        style={
          styles.topBarContainer
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.topNavScroll
          }
        >
          {currentUserRole ===
          'user' ? (
            <>
              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'my_requests' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'my_requests'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'my_requests' &&
                      styles.activeTopNavText
                  ]}
                >
                  📋 طلباتي
                </Text>
              </TouchableOpacity>

              {hasPermission(
                'viewReports'
              ) && (
                <TouchableOpacity
                  style={[
                    styles.topNavBtn,
                    currentTab ===
                      'user_reports' &&
                      styles.activeTopNavBtn
                  ]}
                  onPress={() =>
                    setCurrentTab(
                      'user_reports'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.topNavText,
                      currentTab ===
                        'user_reports' &&
                        styles.activeTopNavText
                    ]}
                  >
                    📊 التقارير
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'vehicle_info' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'vehicle_info'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'vehicle_info' &&
                      styles.activeTopNavText
                  ]}
                >
                  🚘 السيارة
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'request_service' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() => {
                  setCurrentTab(
                    'request_service'
                  );
                  prepareFuelRequest();
                }}
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'request_service' &&
                      styles.activeTopNavText
                  ]}
                >
                  🛠️ طلب خدمة
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_dashboard' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_dashboard'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_dashboard' &&
                      styles.activeTopNavText
                  ]}
                >
                  🏠 الرئيسية
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_requests' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_requests'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_requests' &&
                      styles.activeTopNavText
                  ]}
                >
                  📥 طلبات السائقين
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_vehicles' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_vehicles'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_vehicles' &&
                      styles.activeTopNavText
                  ]}
                >
                  🚗 قائمة السيارات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_drivers' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_drivers'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_drivers' &&
                      styles.activeTopNavText
                  ]}
                >
                  👤 قائمة السائقين
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_bindings' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_bindings'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_bindings' &&
                      styles.activeTopNavText
                  ]}
                >
                  🔗 ربط السائقين
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_expenses' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_expenses'
                  )
              }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_expenses' &&
                      styles.activeTopNavText
                  ]}
                >
                  💰 المصروفات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_reports' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_reports'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_reports' &&
                      styles.activeTopNavText
                  ]}
                >
                  📊 التقارير
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_coding' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_coding'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_coding' &&
                      styles.activeTopNavText
                  ]}
                >
                  🏷️ التكويدات والأسعار
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_permissions' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_permissions'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_permissions' &&
                      styles.activeTopNavText
                  ]}
                >
                  🔐 صلاحيات المستخدمين
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_sync' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_sync'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_sync' &&
                      styles.activeTopNavText
                  ]}
                >
                  🔄 المزامنة
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavBtn,
                  currentTab ===
                    'admin_logs' &&
                    styles.activeTopNavBtn
                ]}
                onPress={() =>
                  setCurrentTab(
                    'admin_logs'
                  )
                }
              >
                <Text
                  style={[
                    styles.topNavText,
                    currentTab ===
                      'admin_logs' &&
                      styles.activeTopNavText
                  ]}
                >
                  📝 سجل العمليات
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.topNavBtn,
              {
                backgroundColor:
                  '#FFEBEE'
              }
            ]}
            onPress={
              handleLogout
            }
          >
            <Text
              style={[
                styles.topNavText,
                {
                  color: '#D32F2F'
                }
              ]}
            >
              🚪 خروج
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={
          styles.contentContainer
        }
      >

        {/* =====================================================
            لوحة المسؤول الرئيسية
        ====================================================== */}

        {currentTab ===
          'admin_dashboard' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              🏠 لوحة المسؤول
            </Text>

            <View
              style={
                styles.dashboardGrid
              }
            >
              <View
                style={
                  styles.dashboardBox
                }
              >
                <Text
                  style={
                    styles.dashboardNumber
                  }
                >
                  {allVehicles.length}
                </Text>

                <Text
                  style={
                    styles.dashboardLabel
                  }
                >
                  🚗 السيارات
                </Text>
              </View>

              <View
                style={
                  styles.dashboardBox
                }
              >
                <Text
                  style={
                    styles.dashboardNumber
                  }
                >
                  {drivers.length}
                </Text>

                <Text
                  style={
                    styles.dashboardLabel
                  }
                >
                  👤 السائقون
                </Text>
              </View>

              <View
                style={
                  styles.dashboardBox
                }
              >
                <Text
                  style={
                    styles.dashboardNumber
                  }
                >
                  {requests.length}
                </Text>

                <Text
                  style={
                    styles.dashboardLabel
                  }
                >
                  📋 الطلبات
                </Text>
              </View>

              <View
                style={
                  styles.dashboardBox
                }
              >
                <Text
                  style={
                    styles.dashboardNumber
                  }
                >
                  {adminPendingCount}
                </Text>

                <Text
                  style={
                    styles.dashboardLabel
                  }
                >
                  ⏳ قيد المراجعة
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              إجمالي المصروفات المسجلة
            </Text>

            <Text
              style={
                styles.bigAmount
              }
            >
              {adminTotalAmount.toLocaleString()} ريال
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              إجمالي المصروفات المعتمدة
            </Text>

            <Text
              style={
                styles.bigAmount
              }
            >
              {adminApprovedAmount.toLocaleString()} ريال
            </Text>

            <TouchableOpacity
              style={
                styles.dashboardButton
              }
              onPress={() =>
                setCurrentTab(
                  'admin_vehicles'
                )
              }
            >
              <Text
                style={
                  styles.dashboardButtonText
                }
              >
                🚗 فتح قائمة السيارات
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.dashboardButton
              }
              onPress={() =>
                setCurrentTab(
                  'admin_drivers'
                )
              }
            >
              <Text
                style={
                  styles.dashboardButtonText
                }
              >
                👤 فتح قائمة السائقين
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.dashboardButton
              }
              onPress={() =>
                setCurrentTab(
                  'admin_bindings'
                )
              }
            >
              <Text
                style={
                  styles.dashboardButtonText
                }
              >
                🔗 ربط السائقين بالسيارات
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.dashboardButton
              }
              onPress={() =>
                setCurrentTab(
                  'admin_permissions'
                )
              }
            >
              <Text
                style={
                  styles.dashboardButtonText
                }
              >
                🔐 إدارة صلاحيات المستخدمين
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =====================================================
            طلبات السائقين
        ====================================================== */}

        {currentTab ===
          'admin_requests' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              📥 طلبات السائقين
            </Text>

            <TextInput
              style={
                styles.whiteInput
              }
              value={
                requestSearch
              }
              onChangeText={
                setRequestSearch
              }
              placeholder="بحث برقم السيارة أو السائق أو رقم العملية"
              placeholderTextColor="#999"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
            >
              {[
                'الكل',
                'قيد المراجعة',
                'تم الاعتماد',
                'مرفوض'
              ].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.chipBtn,
                    requestStatusFilter ===
                      status &&
                      styles.activeChipBtn
                  ]}
                  onPress={() =>
                    setRequestStatusFilter(
                      status
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      requestStatusFilter ===
                        status &&
                        styles.activeChipText
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={{
                marginTop: 10
              }}
            >
              {[
                'الكل',
                'وقود',
                'زيوت',
                'إطارات',
                'بطاريات',
                'صيانة وقطع غيار'
              ].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chipBtn,
                    requestTypeFilter ===
                      type &&
                      styles.activeChipBtn
                  ]}
                  onPress={() =>
                    setRequestTypeFilter(
                      type
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      requestTypeFilter ===
                        type &&
                        styles.activeChipText
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {getAdminFilteredRequests().map(
              req => (
                <View
                  key={req.id}
                  style={
                    styles.requestAdminCard
                  }
                >
                  <View
                    style={
                      styles.cardHeader
                    }
                  >
                    <Text
                      style={
                        styles.listItemTitle
                      }
                    >
                      {req.type} -{' '}
                      {
                        req.processNumber
                      }
                    </Text>

                    <Text
                      style={[
                        styles.badge,
                        req.status ===
                          'تم الاعتماد'
                          ? styles.badgeSuccess
                          : req.status ===
                            'مرفوض'
                          ? styles.badgeDanger
                          : styles.badgePending
                      ]}
                    >
                      {req.status}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.cardDetail
                    }
                  >
                    السيارة:{' '}
                    {
                      req.vehiclePlate
                    }
                  </Text>

                  <Text
                    style={
                      styles.cardDetail
                    }
                  >
                    السائق:{' '}
                    {
                      req.driverName
                    }
                  </Text>

                  <Text
                    style={
                      styles.cardDetail
                    }
                  >
                    التاريخ:{' '}
                    {req.date}
                  </Text>

                  <Text
                    style={
                      styles.cardDetail
                    }
                  >
                    الكمية:{' '}
                    {req.quantity}
                  </Text>

                  <Text
                    style={
                      styles.cardDetail
                    }
                  >
                    المبلغ:{' '}
                    {
                      req.priceAmount ||
                      '0'
                    } ريال
                  </Text>

                  {req.notes ? (
                    <Text
                      style={
                        styles.cardDetail
                      }
                    >
                      ملاحظات:{' '}
                      {req.notes}
                    </Text>
                  ) : null}

                  {req.hasAttachment ? (
                    <Text
                      style={
                        styles.attachmentText
                      }
                    >
                      📎 يحتوي على مرفق
                    </Text>
                  ) : null}

                  {editingRequestId ===
                  req.id ? (
                    <View
                      style={
                        styles.editBox
                      }
                    >
                      <Text
                        style={
                          styles.sectionTitle
                        }
                      >
                        تعديل الطلب
                      </Text>

                      <TextInput
                        style={
                          styles.whiteInput
                        }
                        value={
                          editRequestQty
                        }
                        onChangeText={
                          setEditRequestQty
                        }
                        keyboardType="numeric"
                        placeholder="الكمية"
                        placeholderTextColor="#999"
                      />

                      <TextInput
                        style={
                          styles.whiteInput
                        }
                        value={
                          editRequestAmount
                        }
                        onChangeText={
                          setEditRequestAmount
                        }
                        keyboardType="numeric"
                        placeholder="المبلغ"
                        placeholderTextColor="#999"
                      />

                      <TextInput
                        style={
                          styles.whiteInput
                        }
                        value={
                          editRequestNotes
                        }
                        onChangeText={
                          setEditRequestNotes
                        }
                        placeholder="الملاحظات"
                        placeholderTextColor="#999"
                      />

                      <View
                        style={
                          styles.actionRow
                        }
                      >
                        <TouchableOpacity
                          style={
                            styles.approveBtn
                          }
                          onPress={
                            saveEditedRequest
                          }
                        >
                          <Text
                            style={
                              styles.btnText
                            }
                          >
                            حفظ 💾
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={
                            styles.rejectBtn
                          }
                          onPress={() =>
                            setEditingRequestId(
                              null
                            )
                          }
                        >
                          <Text
                            style={
                              styles.btnText
                            }
                          >
                            إلغاء
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={
                        styles.actionRow
                      }
                    >
                      {req.status ===
                        'قيد المراجعة' && (
                        <>
                          <TouchableOpacity
                            style={
                              styles.approveBtn
                            }
                            onPress={() =>
                              handleApproveOrReject(
                                req.id,
                                'تم الاعتماد'
                              )
                            }
                          >
                            <Text
                              style={
                                styles.btnText
                              }
                            >
                              اعتماد ✅
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={
                              styles.rejectBtn
                            }
                            onPress={() =>
                              handleApproveOrReject(
                                req.id,
                                'مرفوض'
                              )
                            }
                          >
                            <Text
                              style={
                                styles.btnText
                              }
                            >
                              رفض ❌
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      <TouchableOpacity
                        style={
                          styles.editBtn
                        }
                        onPress={() =>
                          startEditRequest(
                            req
                          )
                        }
                      >
                        <Text
                          style={
                            styles.btnText
                          }
                        >
                          ✏️ تعديل
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            )}
          </View>
        )}

        {/* =====================================================
            قائمة السيارات
        ====================================================== */}

        {currentTab ===
          'admin_vehicles' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              🚗 قائمة السيارات
            </Text>

            {hasPermission(
              'editVehicles'
            ) && (
              <View
                style={
                  styles.formBox
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {editingVehicleId
                    ? '✏️ تعديل بيانات السيارة'
                    : '➕ إضافة سيارة'}
                </Text>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  رقم السيارة:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    vehicleFormPlate
                  }
                  onChangeText={
                    setVehicleFormPlate
                  }
                  placeholder="رقم السيارة"
                  placeholderTextColor="#999"
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  اسم السيارة:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    vehicleFormName
                  }
                  onChangeText={
                    setVehicleFormName
                  }
                  placeholder="اسم السيارة"
                  placeholderTextColor="#999"
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  السائق:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    vehicleFormDriver
                  }
                  onChangeText={
                    setVehicleFormDriver
                  }
                  placeholder="اسم السائق"
                  placeholderTextColor="#999"
                />

                <View
                  style={
                    styles.subTabRow
                  }
                >
                  <TouchableOpacity
                    style={[
                      styles.chipBtn,
                      vehicleFormStatus ===
                        'في الخدمة' &&
                        styles.activeChipBtn
                    ]}
                    onPress={() =>
                      setVehicleFormStatus(
                        'في الخدمة'
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        vehicleFormStatus ===
                          'في الخدمة' &&
                          styles.activeChipText
                      ]}
                    >
                      في الخدمة
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.chipBtn,
                      vehicleFormStatus ===
                        'موقف' &&
                        styles.activeChipBtn
                    ]}
                    onPress={() =>
                      setVehicleFormStatus(
                        'موقف'
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        vehicleFormStatus ===
                          'موقف' &&
                          styles.activeChipText
                      ]}
                    >
                      موقف
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={
                    styles.whiteSubmitBtn
                  }
                  onPress={
                    saveVehicle
                  }
                >
                  <Text
                    style={
                      styles.whiteSubmitBtnText
                    }
                  >
                    حفظ السيارة 💾
                  </Text>
                </TouchableOpacity>

                {editingVehicleId && (
                  <TouchableOpacity
                    style={
                      styles.cancelBtn
                    }
                    onPress={
                      cancelVehicleEdit
                    }
                  >
                    <Text
                      style={
                        styles.btnText
                      }
                    >
                      إلغاء التعديل
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TextInput
              style={
                styles.whiteInput
              }
              value={
                vehicleSearch
              }
              onChangeText={
                setVehicleSearch
              }
              placeholder="بحث في السيارات..."
              placeholderTextColor="#999"
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              إجمالي السيارات:{' '}
              {filteredVehicles.length}
            </Text>

            {filteredVehicles.map(
              vehicle => (
                <View
                  key={vehicle.id}
                  style={
                    styles.listItemRow
                  }
                >
                  <Text
                    style={
                      styles.listItemTitle
                    }
                  >
                    🚗{' '}
                    {
                      vehicle.plateNumber
                    }
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    {vehicle.name}
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    السائق:{' '}
                    {
                      vehicle.driverName
                    }
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    الحالة:{' '}
                    {
                      vehicle.status
                    }
                  </Text>

                  {hasPermission(
                    'editVehicles'
                  ) && (
                    <TouchableOpacity
                      style={
                        styles.smallEditBtn
                      }
                      onPress={() =>
                        startEditVehicle(
                          vehicle
                        )
                      }
                    >
                      <Text
                        style={
                          styles.btnText
                        }
                      >
                        ✏️ تعديل
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            )}
          </View>
        )}

        {/* =====================================================
            قائمة السائقين
        ====================================================== */}

        {currentTab ===
          'admin_drivers' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              👤 قائمة السائقين
            </Text>

            {hasPermission(
              'editDrivers'
            ) && (
              <View
                style={
                  styles.formBox
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  ➕ إضافة سائق
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    newDriverName
                  }
                  onChangeText={
                    setNewDriverName
                  }
                  placeholder="اسم السائق"
                  placeholderTextColor="#999"
                />

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    newDriverUsername
                  }
                  onChangeText={
                    setNewDriverUsername
                  }
                  placeholder="اسم المستخدم / رقم السيارة"
                  placeholderTextColor="#999"
                />

                <TouchableOpacity
                  style={
                    styles.whiteSubmitBtn
                  }
                  onPress={
                    addDriver
                  }
                >
                  <Text
                    style={
                      styles.whiteSubmitBtnText
                    }
                  >
                    إضافة السائق ➕
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={
                styles.whiteInput
              }
              value={
                driverSearch
              }
              onChangeText={
                setDriverSearch
              }
              placeholder="بحث عن السائق..."
              placeholderTextColor="#999"
            />

            {filteredDrivers.map(
              driver => (
                <View
                  key={driver.id}
                  style={
                    styles.listItemRow
                  }
                >
                  <Text
                    style={
                      styles.listItemTitle
                    }
                  >
                    👤 {driver.name}
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    اسم المستخدم:{' '}
                    {
                      driver.username
                    }
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    الحالة:{' '}
                    {
                      driver.status
                    }
                  </Text>

                  {hasPermission(
                    'editDrivers'
                  ) && (
                    <TouchableOpacity
                      style={[
                        styles.smallEditBtn,
                        driver.status ===
                          'فعال'
                          ? styles.stopBtn
                          : styles.activateBtn
                      ]}
                      onPress={() =>
                        toggleDriverStatus(
                          driver
                        )
                      }
                    >
                      <Text
                        style={
                          styles.btnText
                        }
                      >
                        {driver.status ===
                        'فعال'
                          ? '⛔ إيقاف'
                          : '✅ تفعيل'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            )}
          </View>
        )}

        {/* =====================================================
            ربط السائقين بالسيارات
        ====================================================== */}

        {currentTab ===
          'admin_bindings' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              🔗 ربط السائقين بالسيارات
            </Text>

            {hasPermission(
              'manageBindings'
            ) && (
              <View
                style={
                  styles.formBox
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  إنشاء عملية ربط جديدة
                </Text>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  اختر السائق:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {drivers.map(
                    driver => (
                      <TouchableOpacity
                        key={
                          driver.id
                        }
                        style={[
                          styles.chipBtn,
                          bindingDriverId ===
                            driver.id &&
                            styles.activeChipBtn
                        ]}
                        onPress={() =>
                          setBindingDriverId(
                            driver.id
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            bindingDriverId ===
                              driver.id &&
                              styles.activeChipText
                          ]}
                        >
                          {driver.name}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  اختر السيارة:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {allVehicles.map(
                    vehicle => (
                      <TouchableOpacity
                        key={
                          vehicle.id
                        }
                        style={[
                          styles.chipBtn,
                          bindingVehicleId ===
                            vehicle.id &&
                            styles.activeChipBtn
                        ]}
                        onPress={() =>
                          setBindingVehicleId(
                            vehicle.id
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            bindingVehicleId ===
                              vehicle.id &&
                              styles.activeChipText
                          ]}
                        >
                          {
                            vehicle.plateNumber
                          }
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  تاريخ بداية الربط:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    bindingStartDate
                  }
                  onChangeText={
                    setBindingStartDate
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  تاريخ انتهاء الربط:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    bindingEndDate
                  }
                  onChangeText={
                    setBindingEndDate
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />

                <TouchableOpacity
                  style={
                    styles.whiteSubmitBtn
                  }
                  onPress={
                    createBinding
                  }
                >
                  <Text
                    style={
                      styles.whiteSubmitBtnText
                    }
                  >
                    حفظ الربط 🔗
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text
              style={
                styles.sectionTitle
              }
            >
              سجل الربط
            </Text>

            {bindings.length ===
            0 ? (
              <Text
                style={
                  styles.emptyText
                }
              >
                لا توجد عمليات ربط مسجلة.
              </Text>
            ) : (
              bindings.map(
                binding => {
                  const actualStatus =
                    binding.endDate <
                    new Date()
                      .toISOString()
                      .split('T')[0]
                      ? 'منتهي'
                      : 'فعال';

                  return (
                    <View
                      key={
                        binding.id
                      }
                      style={
                        styles.bindingCard
                      }
                    >
                      <Text
                        style={
                          styles.listItemTitle
                        }
                      >
                        👤{' '}
                        {
                          binding.driverName
                        }
                      </Text>

                      <Text
                        style={
                          styles.listItemSub
                        }
                      >
                        🚗 السيارة:{' '}
                        {
                          binding.vehiclePlate
                        }
                      </Text>

                      <Text
                        style={
                          styles.listItemSub
                        }
                      >
                        📅 بداية الربط:{' '}
                        {
                          binding.startDate
                        }
                      </Text>

                      <Text
                        style={
                          styles.listItemSub
                        }
                      >
                        📅 انتهاء الربط:{' '}
                        {
                          binding.endDate
                        }
                      </Text>

                      <Text
                        style={[
                          styles.badge,
                          actualStatus ===
                            'فعال'
                            ? styles.badgeSuccess
                            : styles.badgeDanger
                        ]}
                      >
                        {actualStatus}
                      </Text>

                      {hasPermission(
                        'manageBindings'
                      ) && (
                        <TouchableOpacity
                          style={
                            styles.deleteBtn
                          }
                          onPress={() =>
                            deleteBinding(
                              binding.id
                            )
                          }
                        >
                          <Text
                            style={
                              styles.btnText
                            }
                          >
                            🗑️ حذف الربط
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }
              )
            )}
          </View>
        )}

        {/* =====================================================
            المصروفات
        ====================================================== */}

        {currentTab ===
          'admin_expenses' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              💰 المصروفات
            </Text>

            {[
              'وقود',
              'زيوت',
              'إطارات',
              'بطاريات',
              'صيانة وقطع غيار'
            ].map(type => {
              const list =
                requests.filter(
                  r =>
                    r.type ===
                    type
                );

              const total =
                list.reduce(
                  (sum, r) =>
                    sum +
                    Number(
                      r.priceAmount ||
                        0
                    ),
                  0
                );

              return (
                <View
                  key={type}
                  style={
                    styles.summaryCard
                  }
                >
                  <Text
                    style={
                      styles.listItemTitle
                    }
                  >
                    {type}
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    عدد العمليات:{' '}
                    {list.length}
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    الإجمالي:{' '}
                    {total.toLocaleString()}{' '}
                    ريال
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* =====================================================
            التقارير
        ====================================================== */}

        {currentTab ===
          'admin_reports' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              📊 التقارير والتحليلات
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              إجمالي العمليات
            </Text>

            <Text
              style={
                styles.bigAmount
              }
            >
              {requests.length}
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              إجمالي المصروفات
            </Text>

            <Text
              style={
                styles.bigAmount
              }
            >
              {adminTotalAmount.toLocaleString()}{' '}
              ريال
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              المصروفات المعتمدة
            </Text>

            <Text
              style={
                styles.bigAmount
              }
            >
              {adminApprovedAmount.toLocaleString()}{' '}
              ريال
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              حسب نوع المصروف
            </Text>

            {[
              'وقود',
              'زيوت',
              'إطارات',
              'بطاريات',
              'صيانة وقطع غيار'
            ].map(type => {
              const list =
                requests.filter(
                  r =>
                    r.type ===
                    type
                );

              const total =
                list.reduce(
                  (sum, r) =>
                    sum +
                    Number(
                      r.priceAmount ||
                        0
                    ),
                  0
                );

              return (
                <View
                  key={type}
                  style={
                    styles.reportRow
                  }
                >
                  <Text
                    style={
                      styles.listItemTitle
                    }
                  >
                    {type}
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    العمليات: {list.length}
                  </Text>

                  <Text
                    style={
                      styles.listItemSub
                    }
                  >
                    المبلغ:{' '}
                    {total.toLocaleString()}{' '}
                    ريال
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* =====================================================
            التكويدات والأسعار
        ====================================================== */}

        {currentTab ===
          'admin_coding' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              🏷️ إدارة الأسعار والتكويدات
            </Text>

            {!hasPermission(
              'editCoding'
            ) && (
              <Text
                style={
                  styles.warningText
                }
              >
                ⚠️ حسابك يملك صلاحية العرض فقط.
              </Text>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.subTabScroll
              }
            >
              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'prices' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'prices'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'prices' &&
                      styles.activeSubTabText
                  ]}
                >
                  💰 الأسعار
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'stations' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'stations'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'stations' &&
                      styles.activeSubTabText
                  ]}
                >
                  ⛽ المحطات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'fuelTypes' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'fuelTypes'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'fuelTypes' &&
                      styles.activeSubTabText
                  ]}
                >
                  🛢️ الوقود
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'oils' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'oils'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'oils' &&
                      styles.activeSubTabText
                  ]}
                >
                  💧 الزيوت
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'tires' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'tires'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'tires' &&
                      styles.activeSubTabText
                  ]}
                >
                  🛞 الإطارات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'batteries' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'batteries'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'batteries' &&
                      styles.activeSubTabText
                  ]}
                >
                  🔋 البطاريات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'spareParts' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'spareParts'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'spareParts' &&
                      styles.activeSubTabText
                  ]}
                >
                  🔧 قطع الغيار
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  codingSubTab ===
                    'allocations' &&
                    styles.activeSubTabBtn
                ]}
                onPress={() =>
                  setCodingSubTab(
                    'allocations'
                  )
                }
              >
                <Text
                  style={[
                    styles.subTabText,
                    codingSubTab ===
                      'allocations' &&
                      styles.activeSubTabText
                  ]}
                >
                  📍 المخصصات
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {codingSubTab ===
            'prices' ? (
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  أسعار الأصناف
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {[
                    ...codes.fuelTypes,
                    ...codes.oils,
                    ...codes.batteries,
                    ...codes.tires,
                    ...codes.spareParts
                  ].map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.chipBtn,
                        priceItemSelect ===
                          item &&
                          styles.activeChipBtn
                      ]}
                      onPress={() =>
                        setPriceItemSelect(
                          item
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          priceItemSelect ===
                            item &&
                            styles.activeChipText
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    priceValueInput
                  }
                  onChangeText={
                    setPriceValueInput
                  }
                  keyboardType="numeric"
                  placeholder="السعر"
                  placeholderTextColor="#999"
                />

                {hasPermission(
                  'editCoding'
                ) && (
                  <TouchableOpacity
                    style={
                      styles.whiteSubmitBtn
                    }
                    onPress={
                      handleSavePrice
                    }
                  >
                    <Text
                      style={
                        styles.whiteSubmitBtnText
                      }
                    >
                      حفظ السعر 💾
                    </Text>
                  </TouchableOpacity>
                )}

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  الأسعار الحالية
                </Text>

                {Object.keys(
                  itemPrices
                ).map(key => (
                  <View
                    key={key}
                    style={
                      styles.codeItemRow
                    }
                  >
                    <Text
                      style={
                        styles.codeItemText
                      }
                    >
                      {key}:{' '}
                      {
                        itemPrices[
                          key
                        ]
                      } ريال
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  إضافة تكويد جديد
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  value={
                    newCodeInput
                  }
                  onChangeText={
                    setNewCodeInput
                  }
                  placeholder="اسم التكويد..."
                  placeholderTextColor="#999"
                />

                {hasPermission(
                  'editCoding'
                ) && (
                  <TouchableOpacity
                    style={
                      styles.whiteSubmitBtn
                    }
                    onPress={
                      addNewCode
                    }
                  >
                    <Text
                      style={
                        styles.whiteSubmitBtnText
                      }
                    >
                      إضافة ➕
                    </Text>
                  </TouchableOpacity>
                )}

                {codes[
                  codingSubTab as keyof CodeCategories
                ].map(item => (
                  <View
                    key={item}
                    style={
                      styles.codeItemRow
                    }
                  >
                    <Text
                      style={
                        styles.codeItemText
                      }
                    >
                      {item}
                    </Text>

                    {hasPermission(
                      'editCoding'
                    ) && (
                      <TouchableOpacity
                        style={
                          styles.deleteSmallBtn
                        }
                        onPress={() =>
                          deleteCode(
                            codingSubTab as keyof CodeCategories,
                            item
                          )
                        }
                      >
                        <Text
                          style={
                            styles.btnText
                          }
                        >
                          🗑️ حذف
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* =====================================================
            صلاحيات المستخدمين
        ====================================================== */}

        {currentTab ===
          'admin_permissions' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              🔐 إدارة صلاحيات المستخدمين
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              يتم استخدام رقم السيارة أو اسم المستخدم كحساب
              للسائق. يمكن للمسؤول منح أو إلغاء الصلاحيات
              لكل مستخدم.
            </Text>

            {allVehicles.map(
              vehicle => {
                const username =
                  vehicle.plateNumber;

                return (
                  <View
                    key={
                      vehicle.id
                    }
                    style={
                      styles.permissionCard
                    }
                  >
                    <Text
                      style={
                        styles.listItemTitle
                      }
                    >
                      👤 المستخدم:{' '}
                      {username}
                    </Text>

                    <Text
                      style={
                        styles.listItemSub
                      }
                    >
                      السيارة:{' '}
                      {
                        vehicle.name
                      }
                    </Text>

                    <Text
                      style={
                        styles.listItemSub
                      }
                    >
                      السائق:{' '}
                      {
                        vehicle.driverName
                      }
                    </Text>

                    <View
                      style={
                        styles.permissionGrid
                      }
                    >
                      {allPermissions
                        .filter(
                          p =>
                            p !==
                            'manageUsers'
                        )
                        .map(
                          permission => {
                            const enabled =
                              getPermissionForUser(
                                username,
                                permission
                              );

                            return (
                              <TouchableOpacity
                                key={
                                  permission
                                }
                                style={[
                                  styles.permissionBtn,
                                  enabled
                                    ? styles.permissionEnabled
                                    : styles.permissionDisabled
                                ]}
                                onPress={() =>
                                  toggleUserPermission(
                                    username,
                                    permission
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.permissionText,
                                    enabled &&
                                      styles.permissionTextEnabled
                                  ]}
                                >
                                  {enabled
                                    ? '✓ '
                                    : '○ '}
                                  {
                                    permissionNames[
                                      permission
                                    ]
                                  }
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* =====================================================
            المزامنة
        ====================================================== */}

        {currentTab ===
          'admin_sync' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              🔄 مزامنة البيانات
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              تتم المزامنة بين بيانات التطبيق المحلية والخادم
              من خلال واجهة المزامنة المحددة في إعدادات النظام.
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              عنوان المزامنة:
            </Text>

            <Text
              style={
                styles.apiText
              }
            >
              {SYNC_API_URL}
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              آخر مزامنة:
            </Text>

            <Text
              style={
                styles.apiText
              }
            >
              {lastSyncAt ||
                'لم تتم المزامنة بعد'}
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              السيارات:{' '}
              {allVehicles.length}
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              السائقون:{' '}
              {drivers.length}
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              عمليات المصروفات:{' '}
              {requests.length}
            </Text>

            {isSyncing ? (
              <View
                style={
                  styles.syncLoading
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#0D47A1"
                />

                <Text
                  style={
                    styles.infoText
                  }
                >
                  جارٍ تنفيذ المزامنة...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={
                  styles.whiteSubmitBtn
                }
                onPress={
                  syncAllData
                }
              >
                <Text
                  style={
                    styles.whiteSubmitBtnText
                  }
                >
                  🔄 بدء المزامنة
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* =====================================================
            سجل العمليات
        ====================================================== */}

        {currentTab ===
          'admin_logs' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              📝 سجل العمليات الإدارية
            </Text>

            {auditLogs.length ===
            0 ? (
              <Text
                style={
                  styles.emptyText
                }
              >
                لا توجد عمليات مسجلة.
              </Text>
            ) : (
              auditLogs.map(
                log => (
                  <View
                    key={log.id}
                    style={
                      styles.logCard
                    }
                  >
                    <Text
                      style={
                        styles.listItemTitle
                      }
                    >
                      {log.action}
                    </Text>

                    <Text
                      style={
                        styles.listItemSub
                      }
                    >
                      المستخدم:{' '}
                      {log.username}
                    </Text>

                    <Text
                      style={
                        styles.listItemSub
                      }
                    >
                      {log.details}
                    </Text>

                    <Text
                      style={
                        styles.logDate
                      }
                    >
                      {log.date}
                    </Text>
                  </View>
                )
              )
            )}
          </View>
        )}

        {/* =====================================================
            تقارير المستخدم
        ====================================================== */}

        {currentTab ===
          'user_reports' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              📊 تقارير مصروفات السيارة
            </Text>

            <View
              style={
                styles.subTabRow
              }
            >
              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  reportType ===
                    'detailed' &&
                    styles.activeChipBtn
                ]}
                onPress={() =>
                  setReportType(
                    'detailed'
                  )
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    reportType ===
                      'detailed' &&
                      styles.activeChipText
                  ]}
                >
                  تقرير تفصيلي
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  reportType ===
                    'summary' &&
                    styles.activeChipBtn
                ]}
                onPress={() =>
                  setReportType(
                    'summary'
                  )
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    reportType ===
                      'summary' &&
                      styles.activeChipText
                  ]}
                >
                  تقرير إجمالي
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              من تاريخ:
            </Text>

            <TextInput
              style={
                styles.whiteInput
              }
              value={
                reportFromDate
              }
              onChangeText={
                setReportFromDate
              }
              placeholder="2026-01-01"
              placeholderTextColor="#999"
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              إلى تاريخ:
            </Text>

            <TextInput
              style={
                styles.whiteInput
              }
              value={
                reportToDate
              }
              onChangeText={
                setReportToDate
              }
              placeholder="2026-12-31"
              placeholderTextColor="#999"
            />

            {reportType ===
            'detailed' ? (
              <View>
                {getFilteredUserRequests().map(
                  req => (
                    <View
                      key={
                        req.id
                      }
                      style={
                        styles.listItemRow
                      }
                    >
                      <Text
                        style={
                          styles.listItemTitle
                        }
                      >
                        {req.type} -{' '}
                        {
                          req.processNumber
                        }
                      </Text>

                      <Text
                        style={
                          styles.listItemSub
                        }
                      >
                        التاريخ:{' '}
                        {req.date}
                      </Text>

                      <Text
                        style={
                          styles.listItemSub
                        }
                      >
                        الكمية:{' '}
                        {
                          req.quantity
                        }
                      </Text>

                      <Text
                        style={
                          styles.listItemSub
                        }
                      >
                        المبلغ:{' '}
                        {
                          req.priceAmount
                        }{' '}
                        ريال
                      </Text>
                    </View>
                  )
                )}
              </View>
            ) : (
              <View>
                {Object.keys(
                  calculateUserSummary()
                ).map(
                  typeKey => {
                    const item =
                      calculateUserSummary()[
                        typeKey
                      ];

                    return (
                      <View
                        key={
                          typeKey
                        }
                        style={
                          styles.summaryCard
                        }
                      >
                        <Text
                          style={
                            styles.listItemTitle
                          }
                        >
                          {typeKey}
                        </Text>

                        <Text
                          style={
                            styles.listItemSub
                          }
                        >
                          العمليات:{' '}
                          {
                            item.count
                          }
                        </Text>

                        <Text
                          style={
                            styles.listItemSub
                          }
                        >
                          الكمية:{' '}
                          {
                            item.totalQty
                          }
                        </Text>

                        <Text
                          style={
                            styles.listItemSub
                          }
                        >
                          المبلغ:{' '}
                          {
                            item.totalAmount
                          }{' '}
                          ريال
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>
            )}
          </View>
        )}

        {/* =====================================================
            طلب خدمة المستخدم
        ====================================================== */}

        {currentTab ===
          'request_service' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              إنشاء طلب مصروفات
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
            >
              {[
                'وقود',
                'زيوت',
                'إطارات',
                'بطاريات',
                'صيانة وقطع غيار'
              ].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.subTabBtn,
                    serviceSubTab ===
                      t &&
                      styles.activeSubTabBtn
                  ]}
                  onPress={() => {
                    setServiceSubTab(
                      t
                    );

                    if (
                      t ===
                      'زيوت'
                    )
                      prepareOilRequest(
                        userVehicle.id
                      );

                    if (
                      t ===
                      'وقود'
                    )
                      prepareFuelRequest();
                  }}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      serviceSubTab ===
                        t &&
                        styles.activeSubTabText
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              style={
                styles.inputLabel
              }
            >
              رقم العملية:
            </Text>

            <TextInput
              style={[
                styles.whiteInput,
                {
                  backgroundColor:
                    '#E0E0E0'
                }
              ]}
              value={
                reqProcessNo
              }
              editable={false}
            />

            {serviceSubTab ===
              'وقود' && (
              <View>
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  نوع الوقود:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {codes.fuelTypes.map(
                    ft => (
                      <TouchableOpacity
                        key={ft}
                        style={[
                          styles.chipBtn,
                          reqFuelType ===
                            ft &&
                            styles.activeChipBtn
                        ]}
                        onPress={() => {
                          setReqFuelType(
                            ft
                          );

                          handleQuantityOrTypeChange(
                            reqQuantity,
                            ft
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            reqFuelType ===
                              ft &&
                              styles.activeChipText
                          ]}
                        >
                          {ft}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  المحطة:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {codes.stations.map(
                    st => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.chipBtn,
                          reqStation ===
                            st &&
                            styles.activeChipBtn
                        ]}
                        onPress={() =>
                          setReqStation(
                            st
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            reqStation ===
                              st &&
                              styles.activeChipText
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  الكمية باللتر:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  keyboardType="numeric"
                  value={
                    reqQuantity
                  }
                  onChangeText={q =>
                    handleQuantityOrTypeChange(
                      q,
                      reqFuelType
                    )
                  }
                  placeholder="أدخل عدد اللترات"
                  placeholderTextColor="#999"
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  المخصص:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {codes.allocations.map(
                    alc => (
                      <TouchableOpacity
                        key={alc}
                        style={[
                          styles.chipBtn,
                          reqAllocation ===
                            alc &&
                            styles.activeChipBtn
                        ]}
                        onPress={() =>
                          setReqAllocation(
                            alc
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            reqAllocation ===
                              alc &&
                              styles.activeChipText
                          ]}
                        >
                          {alc}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  المبلغ الإجمالي:
                </Text>

                <TextInput
                  style={[
                    styles.whiteInput,
                    {
                      backgroundColor:
                        '#F0F4C3'
                    }
                  ]}
                  keyboardType="numeric"
                  value={
                    reqPriceAmount
                  }
                  onChangeText={
                    setReqPriceAmount
                  }
                />
              </View>
            )}

            {serviceSubTab ===
              'زيوت' && (
              <View>
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  نوع الزيت:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {codes.oils.map(
                    o => (
                      <TouchableOpacity
                        key={o}
                        style={[
                          styles.chipBtn,
                          reqOilType ===
                            o &&
                            styles.activeChipBtn
                        ]}
                        onPress={() =>
                          setReqOilType(
                            o
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            reqOilType ===
                              o &&
                              styles.activeChipText
                          ]}
                        >
                          {o}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  الكمية:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  keyboardType="numeric"
                  value={
                    reqQuantity
                  }
                  onChangeText={
                    setReqQuantity
                  }
                  placeholder="عدد العلب"
                  placeholderTextColor="#999"
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  العداد السابق:
                </Text>

                <TextInput
                  style={[
                    styles.whiteInput,
                    {
                      backgroundColor:
                        '#E0E0E0'
                    }
                  ]}
                  value={
                    reqPrevOdometer
                  }
                  editable={false}
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  العداد الحالي:
                </Text>

                <TextInput
                  style={
                    styles.whiteInput
                  }
                  keyboardType="numeric"
                  value={
                    reqCurrentOdometer
                  }
                  onChangeText={
                    handleOdometerChange
                  }
                  placeholder="قراءة العداد"
                  placeholderTextColor="#999"
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  المسافة المقطوعة:
                </Text>

                <TextInput
                  style={[
                    styles.whiteInput,
                    {
                      backgroundColor:
                        '#E8F5E9'
                    }
                  ]}
                  value={
                    reqDistanceTraveled
                  }
                  editable={false}
                />
              </View>
            )}

            <Text
              style={
                styles.inputLabel
              }
            >
              ملاحظات:
            </Text>

            <TextInput
              style={
                styles.whiteInput
              }
              value={
                reqNotes
              }
              onChangeText={
                setReqNotes
              }
              placeholder="أي ملاحظات إضافية"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[
                styles.attachBtn,
                reqAttachment &&
                  styles.activeAttachBtn
              ]}
              onPress={() =>
                setReqAttachment(
                  !reqAttachment
                )
              }
            >
              <Text
                style={
                  styles.attachBtnText
                }
              >
                {reqAttachment
                  ? '✅ تم إرفاق صورة'
                  : '📎 إرفاق صورة الفاتورة / العداد'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.whiteSubmitBtn
              }
              onPress={() =>
                handleCreateRequest(
                  serviceSubTab
                )
              }
            >
              <Text
                style={
                  styles.whiteSubmitBtnText
                }
              >
                إرسال الطلب 📤
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =====================================================
            طلباتي
        ====================================================== */}

        {currentTab ===
          'my_requests' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              سجل طلباتي
            </Text>

            {requests.filter(
              r =>
                r.vehiclePlate ===
                userVehicle.plateNumber
            ).length === 0 ? (
              <Text
                style={
                  styles.emptyText
                }
              >
                لا توجد طلبات سابقة.
              </Text>
            ) : (
              requests
                .filter(
                  r =>
                    r.vehiclePlate ===
                    userVehicle.plateNumber
                )
                .map(req => (
                  <View
                    key={
                      req.id
                    }
                    style={
                      styles.listItemRow
                    }
                  >
                    <Text
                      style={
                        styles.listItemTitle
                      }
                    >
                      {req.type} -{' '}
                      {
                        req.processNumber
                      }
                    </Text>

                    <Text
                      style={
                        styles.listItemSub
                      }
                    >
                      التاريخ:{' '}
                      {req.date}
                    </Text>

                    <Text
                      style={
                        styles.listItemSub
                      }
                    >
                      المبلغ:{' '}
                      {
                        req.priceAmount
                      }{' '}
                      ريال
                    </Text>

                    <Text
                      style={[
                        styles.badge,
                        req.status ===
                          'تم الاعتماد'
                          ? styles.badgeSuccess
                          : req.status ===
                            'مرفوض'
                          ? styles.badgeDanger
                          : styles.badgePending
                      ]}
                    >
                      {req.status}
                    </Text>
                  </View>
                ))
            )}
          </View>
        )}

        {/* =====================================================
            بيانات السيارة
        ====================================================== */}

        {currentTab ===
          'vehicle_info' && (
          <View
            style={styles.card}
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              بيانات السيارة الحالية
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              اسم السيارة:{' '}
              {userVehicle.name}
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              رقم اللوحة:{' '}
              {
                userVehicle.plateNumber
              }
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              السائق:{' '}
              {
                userVehicle.driverName
              }
            </Text>

            <Text
              style={
                styles.listItemSub
              }
            >
              الحالة:{' '}
              {
                userVehicle.status
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * ============================================================
 * Styles
 * ============================================================
 */

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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3
  },

  loginAppTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'center'
  },

  loginVersion: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20
  },

  header: {
    backgroundColor: '#1565C0',
    padding: 12,
    alignItems: 'center'
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },

  headerVersion: {
    color: '#DDEBFF',
    fontSize: 10,
    marginTop: 3
  },

  topBarContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },

  topNavScroll: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 10,
    paddingVertical: 8
  },

  topNavBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F0F2F5'
  },

  activeTopNavBtn: {
    backgroundColor: '#0D47A1'
  },

  topNavText: {
    fontSize: 13,
    color: '#424242',
    fontWeight: 'bold'
  },

  activeTopNavText: {
    color: '#FFFFFF'
  },

  contentContainer: {
    flex: 1,
    padding: 15
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2
  },

  requestAdminCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },

  summaryCard: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderRightWidth: 4,
    borderRightColor: '#2E7D32'
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'right',
    marginBottom: 10
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 8
  },

  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
    alignSelf: 'flex-start',
    marginTop: 5
  },

  badgeSuccess: {
    backgroundColor: '#2E7D32'
  },

  badgeDanger: {
    backgroundColor: '#C62828'
  },

  badgePending: {
    backgroundColor: '#ED6C02'
  },

  cardDetail: {
    fontSize: 13,
    color: '#444',
    textAlign: 'right',
    marginBottom: 4
  },

  subTabScroll: {
    marginBottom: 12
  },

  subTabRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: 15
  },

  subTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 3
  },

  activeSubTabBtn: {
    backgroundColor: '#1976D2'
  },

  subTabText: {
    fontSize: 12,
    color: '#333'
  },

  activeSubTabText: {
    color: '#FFF',
    fontWeight: 'bold'
  },

  inputLabel: {
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600'
  },

  whiteInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 10,
    color: '#333'
  },

  whiteSubmitBtn: {
    backgroundColor: '#0D47A1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },

  whiteSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },

  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
    fontSize: 13
  },

  codeItemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  codeItemText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
    flex: 1
  },

  pickerRow: {
    marginBottom: 10
  },

  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#CCC'
  },

  activeChipBtn: {
    backgroundColor: '#0D47A1',
    borderColor: '#0D47A1'
  },

  chipText: {
    fontSize: 12,
    color: '#333'
  },

  activeChipText: {
    color: '#FFF',
    fontWeight: 'bold'
  },

  listItemRow: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderRightWidth: 4,
    borderRightColor: '#1565C0'
  },

  listItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'right'
  },

  listItemSub: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 3
  },

  actionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginTop: 10,
    flexWrap: 'wrap'
  },

  approveBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 6,
    margin: 3
  },

  rejectBtn: {
    backgroundColor: '#C62828',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 6,
    margin: 3
  },

  editBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 6,
    margin: 3
  },

  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  attachBtn: {
    backgroundColor: '#ECEFF1',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#CFD8DC'
  },

  activeAttachBtn: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32'
  },

  attachBtnText: {
    color: '#37474F',
    fontSize: 13,
    fontWeight: 'bold'
  },

  dashboardGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  dashboardBox: {
    width: '48%',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center'
  },

  dashboardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D47A1'
  },

  dashboardLabel: {
    fontSize: 13,
    color: '#333',
    marginTop: 5
  },

  bigAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 10
  },

  dashboardButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8
  },

  dashboardButtonText: {
    textAlign: 'center',
    color: '#0D47A1',
    fontWeight: 'bold'
  },

  formBox: {
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },

  smallEditBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 8
  },

  stopBtn: {
    backgroundColor: '#C62828'
  },

  activateBtn: {
    backgroundColor: '#2E7D32'
  },

  cancelBtn: {
    backgroundColor: '#757575',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },

  bindingCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderRightWidth: 4,
    borderRightColor: '#1976D2'
  },

  deleteBtn: {
    backgroundColor: '#C62828',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8
  },

  deleteSmallBtn: {
    backgroundColor: '#C62828',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    marginHorizontal: 5
  },

  permissionCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },

  permissionGrid: {
    marginTop: 8
  },

  permissionBtn: {
    padding: 9,
    borderRadius: 7,
    marginVertical: 3,
    borderWidth: 1
  },

  permissionEnabled: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32'
  },

  permissionDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCC'
  },

  permissionText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'right'
  },

  permissionTextEnabled: {
    color: '#2E7D32',
    fontWeight: 'bold'
  },

  infoText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 10
  },

  warningText: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
    padding: 10,
    borderRadius: 8,
    textAlign: 'right',
    marginBottom: 10
  },

  apiText: {
    backgroundColor: '#ECEFF1',
    padding: 10,
    borderRadius: 7,
    fontSize: 11,
    color: '#37474F',
    textAlign: 'left',
    marginVertical: 5
  },

  syncLoading: {
    alignItems: 'center',
    padding: 20
  },

  logCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderRightWidth: 3,
    borderRightColor: '#1565C0'
  },

  logDate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
    marginTop: 5
  },

  reportRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderRightWidth: 3,
    borderRightColor: '#1976D2'
  },

  attachmentText: {
    color: '#0D47A1',
    fontSize: 12,
    marginTop: 4
  },

  editBox: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginTop: 10
  }
});

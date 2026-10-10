import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert,
  Modal, SafeAreaView, StatusBar, Switch, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { createClient } from '@supabase/supabase-js';

// إعدادات اتصال Supabase السحابي
const SUPABASE_URL = 'https://mrxmiowlqmlktlerffkn.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_0oUqPI_Mll1sDTjxo-IRoA_KuMEl_wv';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_VERSION = '1.31.8';
const APP_BUILD = '41';

const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F4F7FB', card: '#FFFFFF', text: '#263238', muted: '#718096',
  border: '#E2E8F0', success: '#2E7D32', warning: '#ED8B00', danger: '#C62828',
};

type Vehicle = {
  id: string; name: string; driver: string; status: string; type: string;
  model: string; payload: string; fuelType: string; engineNo: string; chassisNo: string;
  ownership?: 'شركة' | 'خاصة';
};

type RequestItem = {
  id: string; vehicleId: string; driver: string; type: string; date: string;
  qty: number; total: number; status: string; notes?: string; imageUri?: string;
  station?: string; fuelType?: string; unit?: string; oilType?: string;
  itemName?: string; prevOdo?: number; currOdo?: number; distance?: number;
  workshop?: string; engineer?: string; faultType?: string; requiredWork?: string;
  client?: string; serviceDescription?: string; workflow?: string; approvalTrail?: string[];
};

type PermissionSet = {
  addVehicle: boolean; editVehicle: boolean; assignVehicle: boolean;
  changePassword: boolean; reports: boolean; requestService: boolean;
  fuel: boolean; oils: boolean; batteries: boolean; parts: boolean;
  maintenance: boolean; tires: boolean; addDriver: boolean; editDriver: boolean;
  editCodings: boolean; editPrices: boolean;
};

type Assignment = {
  id: string; driver: string; driverId: string; vehicleId: string;
  startDate: string; endDate: string; notes: string;
};

const INITIAL_FLEET: Vehicle[] = [
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
  { id: '56989', name: 'تويوتا فور تشنر 2015', driver: 'نبيل الشوافي', status: 'في الخدمة', type: 'جيب', model: '2015', payload: '7 ركاب', fuelType: 'بنزين', engineNo: 'ENG-56989', chassisNo: 'CHS-56989' },
];

const DEFAULT_PERMISSIONS: PermissionSet = {
  addVehicle: true, editVehicle: false, assignVehicle: false, changePassword: true,
  reports: true, requestService: true, fuel: true, oils: true, batteries: true,
  parts: true, maintenance: true, tires: true, addDriver: false, editDriver: false,
  editCodings: false, editPrices: false,
};

const TODAY = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => `${Number(n || 0).toLocaleString()} ريال`;
const escapeHtml = (s: string) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [fleet, setFleet] = useState<Vehicle[]>(INITIAL_FLEET);
  const [stations, setStations] = useState<string[]>(['محطة الزبيدي', 'محطة الشركة', 'محطة نقدي']);
  const [fuelTypes, setFuelTypes] = useState<string[]>(['ديزل', 'بترول']);
  const [oils, setOils] = useState<string[]>(['تويوتا', 'ليكوي مولي', 'ناشيونال']);
  const [batteries, setBatteries] = useState<string[]>(['بطارية 70 أمبير', 'بطارية 100 أمبير']);
  const [parts, setParts] = useState<string[]>(['فلتر زيت', 'فلتر هواء', 'فحمات فرامل']);
  const [tires, setTires] = useState<string[]>(['إطار 12.00R20', 'إطار 215/75R17.5']);
  const [maintenanceItems, setMaintenanceItems] = useState<string[]>(['صيانة عامة', 'كهرباء', 'ميكانيكا']);
  const [workshops, setWorkshops] = useState<string[]>(['ورشة المركز الرئيسي', 'ورشة الصناعية']);
  const [clients, setClients] = useState<string[]>(['شركة الألوان', 'الشركة العامة']);
  const [engineers, setEngineers] = useState<string[]>(['مهندس أحمد', 'مهندس محمد']);

  const [prices, setPrices] = useState<Record<string, number>>({
    'ديزل': 1200, 'بترول': 1200, 'تويوتا': 4500, 'ليكوي مولي': 6000,
    'ناشيونال': 4000, 'بطارية 70 أمبير': 65000, 'بطارية 100 أمبير': 85000,
    'فلتر زيت': 8000, 'فلتر هواء': 12000, 'فحمات فرامل': 25000,
    'إطار 12.00R20': 85000, 'إطار 215/75R17.5': 65000,
    'صيانة عامة': 10000, 'كهرباء': 10000, 'ميكانيكا': 10000,
  });

  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: 'REQ-1001', vehicleId: '22618', driver: 'عبد الغني علي دحان', type: 'وقود',
      date: '2026-10-01', qty: 50, total: 60000, station: 'محطة الشركة',
      fuelType: 'ديزل', status: 'تمت الموافقة', workflow: 'تمت الموافقة', notes: 'تم التعبئة للرحلة'
    },
  ]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionSet>>({});
  const [userTab, setUserTab] = useState('service');
  const [adminTab, setAdminTab] = useState('requests');
  const [notifications, setNotifications] = useState<{id:string;title:string;body:string;date:string;target:string}[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [tripType, setTripType] = useState('مهمة عمل');
  const [tripDestination, setTripDestination] = useState('');
  const [tripStart, setTripStart] = useState(TODAY());
  const [tripDuration, setTripDuration] = useState('1');
  const [tripReturn, setTripReturn] = useState('');
  const [tripCustody, setTripCustody] = useState('0');
  const [tripTypes, setTripTypes] = useState<string[]>(['مهمة عمل','توصيل مواد','مراجعة جهة']);
  const [tripDestinations, setTripDestinations] = useState<string[]>(['صنعاء','عدن','الحديدة','إب','ذمار','رداع']);
  const [tripRequests, setTripRequests] = useState<any[]>([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeTarget, setNoticeTarget] = useState('الكل');
  const [adminRequestTab, setAdminRequestTab] = useState('وقود');
  const [pricingCategoryModal, setPricingCategoryModal] = useState<string | null>(null);

  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  const [codingModal, setCodingModal] = useState<string | null>(null);
  const [itemEditor, setItemEditor] = useState({ index: -1, value: '' });
  const [newItem, setNewItem] = useState('');

  const [selectedStation, setSelectedStation] = useState(stations[0]);
  const [selectedFuel, setSelectedFuel] = useState(fuelTypes[0]);
  const [selectedOil, setSelectedOil] = useState(oils[0]);
  const [selectedBattery, setSelectedBattery] = useState(batteries[0]);
  const [selectedPart, setSelectedPart] = useState(parts[0]);
  const [selectedTire, setSelectedTire] = useState(tires[0]);
  const [selectedMaintenance, setSelectedMaintenance] = useState(maintenanceItems[0]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(workshops[0]);
  const [selectedEngineer, setSelectedEngineer] = useState(engineers[0]);
  const [selectedClient, setSelectedClient] = useState(clients[0]);
  const [selectedUnit, setSelectedUnit] = useState('دبة');

  const [reqQty, setReqQty] = useState('');
  const [currOdometer, setCurrOdometer] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqImage, setReqImage] = useState<string | undefined>();
  const [faultType, setFaultType] = useState('');
  const [requiredWork, setRequiredWork] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  const [editDriverName, setEditDriverName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportType, setReportType] = useState('الكل');

  const [assignmentForm, setAssignmentForm] = useState<Assignment>({
    id: '', driver: '', driverId: '', vehicleId: '', startDate: TODAY(), endDate: '', notes: '',
  });
  const [driverDropdownVisible, setDriverDropdownVisible] = useState(false);
  const [vehicleDropdownVisible, setVehicleDropdownVisible] = useState(false);

  const [fleetCategory, setFleetCategory] = useState('جميع السيارات');
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleEditId, setVehicleEditId] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Vehicle>({
    id: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
    payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة'
  });

  // مزامنة الطلبات سحابياً مع Supabase عند بدء التشغيل
  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    try {
      const { data, error } = await supabase.from('requests').select('*');
      if (!error && data && data.length > 0) {
        setRequests(data.map((r: any) => ({
          ...r,
          approvalTrail: r.approval_trail || ['أرسل السائق الطلب']
        })));
      }
    } catch (e) {
      console.log('Supabase fetch error:', e);
    }
  };

  const getPermission = (vehicleId: string): PermissionSet =>
    permissions[vehicleId] || DEFAULT_PERMISSIONS;

  const getNextRequestId = () => {
    const nums = requests.map(r => Number(String(r.id).replace(/\D/g, '')) || 0);
    return `REQ-${Math.max(1000, ...nums) + 1}`;
  };

  const lastOdometer = (vehicleId: string) => {
    const rows = requests.filter(r => r.vehicleId === vehicleId && r.type === 'زيوت' && r.currOdo != null);
    return rows.length ? Number(rows[rows.length - 1].currOdo) || 0 : 0;
  };

  const requestTypes = ['وقود', 'زيوت', 'بطاريات', 'قطع غيار', 'صيانة', 'إطارات', 'إرسالية صيانة', 'إرسالية بنشر وخدمات'];
  const [ownershipTypes, setOwnershipTypes] = useState<string[]>(['شركة','خاصة']);

  const codingMap: Record<string, string[]> = {
    'المحروقات': fuelTypes, 'الزيوت': oils, 'البطاريات': batteries, 'قطع الغيار': parts,
    'الإطارات': tires, 'المحطات': stations, 'الصيانة': maintenanceItems,
    'الورش': workshops, 'العملاء': clients, 'المهندسين': engineers, 'مالك السيارة': ownershipTypes, 'نوع المهمة': tripTypes, 'الوجهة/المنطقة': tripDestinations,
  };

  const codingSetters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
    'المحروقات': setFuelTypes, 'الزيوت': setOils, 'البطاريات': setBatteries,
    'قطع الغيار': setParts, 'الإطارات': setTires, 'المحطات': setStations,
    'الصيانة': setMaintenanceItems, 'الورش': setWorkshops, 'العملاء': setClients,
    'المهندسين': setEngineers, 'مالك السيارة': setOwnershipTypes, 'نوع المهمة': setTripTypes, 'الوجهة/المنطقة': setTripDestinations,
  };

  const driverNames = useMemo(
    () => Array.from(new Set(fleet.map(v => v.driver).filter(Boolean))),
    [fleet]
  );

  const assignmentVehicle = fleet.find(v => v.id === assignmentForm.vehicleId.trim());

  const handleLogin = () => {
    const u = username.trim(), p = password.trim();
    if (u === 'ميثاق' && p === '111') {
      setCurrentUser({ role: 'admin', name: 'ميثاق' });
      setUsername(''); setPassword(''); return;
    }
    const found = fleet.find(v => v.id === u);
    if (found && p === '000') {
      if (found.status === 'موقف') {
        Alert.alert('الحساب موقوف', 'هذه السيارة موقوفة حاليًا وممنوعة من تقديم الطلبات.');
        return;
      }
      setCurrentUser({ role: 'driver', ...found });
      setEditDriverName(found.driver);
      setUsername(''); setPassword(''); return;
    }
    Alert.alert('خطأ في الدخول', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  const handleLogout = () => {
    setCurrentUser(null); setUserTab('service'); setAdminTab('requests');
  };

  const resetRequestForm = () => {
    setReqQty(''); setCurrOdometer(''); setReqNotes(''); setReqImage(undefined);
    setFaultType(''); setRequiredWork(''); setServiceDescription('');
    setSelectedWorkshop(workshops[0] || ''); setSelectedEngineer(engineers[0] || '');
    setSelectedClient(clients[0] || ''); setSelectedStation(stations[0] || '');
    setSelectedFuel(fuelTypes[0] || ''); setSelectedOil(oils[0] || '');
    setSelectedBattery(batteries[0] || ''); setSelectedPart(parts[0] || '');
    setSelectedTire(tires[0] || ''); setSelectedMaintenance(maintenanceItems[0] || '');
    setSelectedUnit('دبة');
  };

  const openServiceRequest = (type: string) => {
    resetRequestForm();
    setServiceTypeModal(type);
  };

  const openImagePicker = () => {
    Alert.alert('إرفاق صورة', 'اختر مصدر الصورة', [
      {
        text: 'الكاميرا',
        onPress: async () => {
          const p = await ImagePicker.requestCameraPermissionsAsync();
          if (!p.granted) { Alert.alert('الصلاحية مطلوبة', 'اسمح للتطبيق باستخدام الكاميرا.'); return; }
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
          if (!r.canceled) setReqImage(r.assets[0].uri);
        }
      },
      {
        text: 'المعرض',
        onPress: async () => {
          const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!p.granted) { Alert.alert('الصلاحية مطلوبة', 'اسمح للتطبيق باستخدام الصور.'); return; }
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
          if (!r.canceled) setReqImage(r.assets[0].uri);
        }
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const currentUnitPrice = () => {
    switch (serviceTypeModal) {
      case 'وقود': return prices[selectedFuel] || 0;
      case 'زيوت': return prices[selectedOil] || 0;
      case 'بطاريات': return prices[selectedBattery] || 0;
      case 'قطع غيار': return prices[selectedPart] || 0;
      case 'إطارات': return prices[selectedTire] || 0;
      case 'صيانة': return prices[selectedMaintenance] || 0;
      default: return 0;
    }
  };

  const submitRequest = async () => {
    if (!currentUser || !serviceTypeModal) return;

    const item: RequestItem = {
      id: getNextRequestId(), vehicleId: currentUser.id, driver: currentUser.driver,
      type: serviceTypeModal, date: TODAY(), qty: 1, total: 0,
      status: 'تحت المراجعة', workflow: 'المسؤول المباشر',
      notes: reqNotes, imageUri: reqImage, approvalTrail: ['أرسل السائق الطلب'],
    };

    if (serviceTypeModal === 'وقود') {
      const qty = Number(reqQty);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      item.qty = qty; item.total = qty * currentUnitPrice();
      item.station = selectedStation; item.fuelType = selectedFuel;
    } else if (serviceTypeModal === 'زيوت') {
      const qty = Number(reqQty);
      const odo = Number(currOdometer);
      const prev = lastOdometer(currentUser.id);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      if (!odo || odo < prev) { Alert.alert('تنبيه', `العداد الحالي يجب أن يكون أكبر أو يساوي ${prev}.`); return; }
      item.qty = qty; item.total = qty * currentUnitPrice(); item.oilType = selectedOil;
      item.unit = selectedUnit; item.prevOdo = prev; item.currOdo = odo; item.distance = odo - prev;
    } else if (serviceTypeModal === 'بطاريات') {
      item.itemName = selectedBattery; item.qty = Number(reqQty) || 1;
      item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'قطع غيار') {
      item.itemName = selectedPart; item.qty = Number(reqQty) || 1;
      item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'إطارات') {
      item.itemName = selectedTire; item.qty = Number(reqQty) || 1;
      item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'صيانة') {
      item.itemName = selectedMaintenance; item.qty = Number(reqQty) || 1;
      item.total = item.qty * currentUnitPrice();
      item.workshop = selectedWorkshop; item.engineer = selectedEngineer;
      item.faultType = faultType; item.requiredWork = requiredWork;
    } else if (serviceTypeModal === 'إرسالية صيانة') {
      if (!selectedWorkshop || !selectedEngineer || !faultType.trim() || !requiredWork.trim()) {
        Alert.alert('تنبيه', 'أكمل الورشة والمهندس ونوع العطل والعمل المطلوب.'); return;
      }
      item.qty = 1; item.total = 0;
      item.workshop = selectedWorkshop; item.engineer = selectedEngineer;
      item.faultType = faultType; item.requiredWork = requiredWork;
    } else if (serviceTypeModal === 'إرسالية بنشر وخدمات') {
      if (!selectedClient || !serviceDescription.trim()) {
        Alert.alert('تنبيه', 'اختر العميل واكتب الخدمة المطلوبة.'); return;
      }
      item.qty = 1; item.total = 0;
      item.client = selectedClient; item.serviceDescription = serviceDescription;
    }

    try {
      await supabase.from('requests').insert([
        {
          id: item.id,
          title: `${item.type} - ${item.vehicleId}`,
          applicant_id: item.vehicleId,
          current_step: 1,
          status: item.status,
          workflow: item.workflow,
          approval_trail: item.approvalTrail,
          total: item.total,
          qty: item.qty,
          type: item.type
        }
      ]);
    } catch (e) {
      console.log('Supabase insert error:', e);
    }

    setRequests(prev => [...prev, item]);
    setNotifications(prev => [{id:`NTF-${Date.now()}`,title:'طلب جديد',body:`تم إرسال ${item.type} رقم ${item.id}`,date:TODAY(),target:'المسؤول'}, ...prev]);
    setServiceTypeModal(null);
    resetRequestForm();
    setUserTab('my_requests');
    Alert.alert('تم إرسال الطلب', 'تم إرسال الطلب وحفظه سحابياً بنجاح.');
  };

  const advanceRequest = async (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const stage = r.workflow || 'المسؤول المباشر';
      let nextStage = stage;
      let nextStatus = r.status;
      let newTrail = [...(r.approvalTrail||[])];

      if (stage === 'المسؤول المباشر') { nextStage = 'الخدمات الإدارية'; newTrail.push('وافق المسؤول المباشر'); }
      else if (stage === 'الخدمات الإدارية') { nextStage = 'المسؤول'; newTrail.push('وافقت الخدمات الإدارية'); }
      else if (stage === 'المسؤول') { nextStage = 'تمت الموافقة'; nextStatus = 'تمت الموافقة'; newTrail.push('تمت الموافقة النهائية'); }

      supabase.from('requests').update({ workflow: nextStage, status: nextStatus, approval_trail: newTrail }).eq('id', id).then();

      return { ...r, workflow: nextStage, status: nextStatus, approvalTrail: newTrail };
    }));
  };

  const rejectRequest = async (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const newTrail = [...(r.approvalTrail||[]), `تم رفض الطلب في مرحلة ${r.workflow || 'المسؤول المباشر'}`];
      supabase.from('requests').update({ workflow: 'تم رفض الطلب', status: 'تم رفض الطلب', approval_trail: newTrail }).eq('id', id).then();
      return { ...r, workflow: 'تم رفض الطلب', status: 'تم رفض الطلب', approvalTrail: newTrail };
    }));
  };

  const saveCodingItem = () => {
    if (!codingModal || !newItem.trim()) return;
    const setter = codingSetters[codingModal];
    if (!setter) return;
    setter(prev => {
      const copy = [...prev];
      if (itemEditor.index >= 0) copy[itemEditor.index] = newItem.trim();
      else copy.push(newItem.trim());
      return copy;
    });
    setNewItem(''); setItemEditor({ index: -1, value: '' });
  };

  const deleteCodingItem = (key: string, index: number) => {
    const setter = codingSetters[key];
    if (!setter) return;
    Alert.alert('تأكيد الحذف', 'هل تريد حذف هذا التكويد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => setter(prev => prev.filter((_, i) => i !== index)) }
    ]);
  };

  const setVehiclePermission = (vehicleId: string, key: keyof PermissionSet, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [vehicleId]: { ...(prev[vehicleId] || DEFAULT_PERMISSIONS), [key]: value }
    }));
  };

  const exportExcel = async (rows: RequestItem[], filename: string) => {
    const header = 'الطلب,السيارة,السائق,النوع,التاريخ,الكمية,التكلفة,الحالة,المرحلة\n';
    const body = rows.map(r =>
      [r.id, r.vehicleId, r.driver, r.type, r.date, r.qty, r.total, r.status, r.workflow || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const uri = `${FileSystem.cacheDirectory}${filename}-${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(uri, header + body);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };

  const exportPdf = async (rows: RequestItem[], title: string) => {
    const html = `
      <html><body dir="rtl">
      <h2>${escapeHtml(title)}</h2>
      <table border="1" cellpadding="6" cellspacing="0" width="100%">
      <tr><th>الطلب</th><th>السيارة</th><th>النوع</th><th>التاريخ</th><th>التكلفة</th><th>الحالة</th><th>المرحلة</th></tr>
      ${rows.map(r => `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.vehicleId)}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.date)}</td><td>${money(r.total)}</td><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.workflow || '')}</td></tr>`).join('')}
      </table></body></html>`;
    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
  };

  const renderSelect = (
    label: string, value: string, options: string[],
    setter: (v: string) => void
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        {options.map(o => (
          <TouchableOpacity key={o} onPress={() => setter(o)}
            style={[styles.choice, value === o && styles.choiceActive]}>
            <Text style={[styles.choiceText, value === o && styles.choiceTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCoding = () => (
    <View>
      <Text style={styles.sectionTitle}>التكويدات</Text>
      <Text style={styles.helper}>إضافة وتعديل وحذف التكويدات المستخدمة في الطلبات.</Text>
      {Object.keys(codingMap).map((key, i) => (
        <TouchableOpacity key={key} style={styles.menuCard} onPress={() => setCodingModal(key)}>
          <View style={styles.menuIcon}><Text style={styles.menuIconText}>{['⛽','🛢️','🔋','🔧','🛞','🏪','🛠️','🏭','👥','👨‍🔧'][i]}</Text></View>
          <View style={{flex:1}}>
            <Text style={styles.menuTitle}>{key}</Text>
            <Text style={styles.menuSub}>{codingMap[key].length} عنصر</Text>
          </View>
          <Text style={styles.chevron}>‹</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPricing = () => {
    const pricingGroups: Record<string, { icon: string; items: string[] }> = {
      'تسعير الوقود': { icon: '⛽', items: fuelTypes },
      'تسعير الزيوت': { icon: '🛢️', items: oils },
      'تسعير قطع الغيار': { icon: '🔧', items: parts },
      'تسعير الصيانة': { icon: '🛠️', items: maintenanceItems },
      'تسعير البطاريات': { icon: '🔋', items: batteries },
      'تسعير الإطارات': { icon: '🛞', items: tires },
    };
    const selectedItems = pricingCategoryModal ? pricingGroups[pricingCategoryModal]?.items || [] : [];
    return (
      <View>
        <Text style={styles.sectionTitle}>الأسعار</Text>
        <Text style={styles.helper}>اختر نافذة التسعير المطلوبة ثم أضف أو عدّل سعر كل صنف.</Text>
        {Object.entries(pricingGroups).map(([title, group]) => (
          <TouchableOpacity key={title} style={styles.menuCard} onPress={() => setPricingCategoryModal(title)}>
            <View style={styles.menuIcon}><Text style={styles.menuIconText}>{group.icon}</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.menuTitle}>{title}</Text>
              <Text style={styles.menuSub}>{group.items.length} صنف</Text>
            </View>
            <Text style={styles.chevron}>‹</Text>
          </TouchableOpacity>
        ))}
        <Modal visible={!!pricingCategoryModal} transparent animationType="slide" onRequestClose={() => setPricingCategoryModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{pricingCategoryModal}</Text>
              <ScrollView style={{maxHeight:480}}>
                {selectedItems.map(item => (
                  <View key={item} style={styles.priceRow}>
                    <Text style={[styles.cardText,{flex:1}]}>{item}</Text>
                    <TextInput style={styles.priceInput} keyboardType="numeric" value={String(prices[item] ?? 0)}
                      onChangeText={v => setPrices(p => ({ ...p, [item]: Number(v.replace(/[^\d]/g, '')) || 0 }))} />
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPricingCategoryModal(null)}><Text style={styles.btnText}>حفظ وإغلاق</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderRequestsAdmin = () => {
    const requestTabs: Array<[string,string]> = [['محروقات','وقود'],['زيوت','زيوت'],['قطع غيار','قطع غيار'],['صيانة','صيانة'],['إطارات','إطارات'],['بطاريات','بطاريات'],['إرسالية صيانة','إرسالية صيانة'],['إرسالية بنشر وخدمات','إرسالية بنشر وخدمات']];
    const rows = requests.filter(r => r.type === adminRequestTab);
    return (
      <View>
        <Text style={styles.sectionTitle}>طلبات الخدمات</Text>
        <Text style={styles.helper}>كل نافذة تعرض تفاصيل الطلب والصور المرفقة مع خيارات القبول والرفض.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.requestTabs} contentContainerStyle={{flexDirection:'row-reverse'}}>
          {requestTabs.map(([label,type]) => (
            <TouchableOpacity key={type} onPress={() => setAdminRequestTab(type)} style={[styles.requestTab, adminRequestTab === type && styles.requestTabActive]}>
              <Text style={[styles.requestTabText, adminRequestTab === type && styles.requestTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {rows.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد طلبات من هذا النوع حاليًا.</Text></View> : null}
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
            <Text style={styles.cardTitle}>طلب {r.type}</Text>
            <Text style={styles.cardText}>رقم السيارة: {r.vehicleId}</Text>
            <Text style={styles.cardText}>السائق: {r.driver}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date}</Text>
            <Text style={styles.cardText}>الكمية: {r.qty}</Text>
            <Text style={styles.cardText}>النوع: {r.fuelType || r.oilType || r.itemName || r.type}</Text>
            <Text style={styles.cardText}>القيمة: {money(r.total)}</Text>
            {r.station ? <Text style={styles.cardText}>المحطة: {r.station}</Text> : null}
            {r.unit ? <Text style={styles.cardText}>الوحدة: {r.unit}</Text> : null}
            {r.workshop ? <Text style={styles.cardText}>الورشة: {r.workshop}</Text> : null}
            {r.engineer ? <Text style={styles.cardText}>المهندس: {r.engineer}</Text> : null}
            {r.client ? <Text style={styles.cardText}>العميل: {r.client}</Text> : null}
            {r.faultType ? <Text style={styles.cardText}>نوع العطل: {r.faultType}</Text> : null}
            {r.requiredWork ? <Text style={styles.cardText}>العمل المطلوب: {r.requiredWork}</Text> : null}
            {r.serviceDescription ? <Text style={styles.cardText}>الخدمة: {r.serviceDescription}</Text> : null}
            {r.notes ? <Text style={styles.cardText}>الملاحظات: {r.notes}</Text> : null}
            <Text style={styles.workflowTitle}>المرحلة: {r.workflow || 'المسؤول المباشر'}</Text>
            {(r.approvalTrail||[]).map((step:string,i:number)=><Text key={`${r.id}-trail-${i}`} style={styles.cardText}>• {step}</Text>)}
            {r.imageUri ? <View><Image source={{uri:r.imageUri}} style={styles.requestImage} /><TouchableOpacity style={styles.secondaryBtn} onPress={async()=>{try{if(await Sharing.isAvailableAsync()) await Sharing.shareAsync(r.imageUri!);else Alert.alert('المرفق',r.imageUri);}catch(e){Alert.alert('تعذر فتح المرفق','قد لا يكون ملف الصورة متاحًا على هذا الجهاز.');}}}><Text style={styles.btnText}>فتح / مشاركة الصورة</Text></TouchableOpacity></View> : <Text style={styles.mutedRight}>لا توجد صورة مرفقة</Text>}
            {r.status !== 'تمت الموافقة' && r.status !== 'تم رفض الطلب' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.success}]} onPress={() => advanceRequest(r.id)}><Text style={styles.btnText}>{r.workflow === 'المسؤول' ? 'قبول الطلب' : 'قبول وإحالة'}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.danger}]} onPress={() => rejectRequest(r.id)}><Text style={styles.btnText}>رفض الطلب</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderFleet = () => {
    const categories = ['السيارات المفعلة', 'السيارات الموقف', 'السيارات الخاصة', 'سيارات الشركة', 'جميع السيارات'];
    const filtered = fleet.filter(v => {
      const ownership = v.ownership || 'شركة';
      if (fleetCategory === 'السيارات المفعلة') return v.status !== 'موقف';
      if (fleetCategory === 'السيارات الموقف') return v.status === 'موقف';
      if (fleetCategory === 'السيارات الخاصة') return ownership === 'خاصة';
      if (fleetCategory === 'سيارات الشركة') return ownership === 'شركة';
      return true;
    });

    const openAddVehicle = () => {
      setVehicleEditId(null);
      setVehicleForm({
        id: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
        payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة'
      });
      setVehicleModalVisible(true);
    };

    const openEditVehicle = (v: Vehicle) => {
      setVehicleEditId(v.id);
      setVehicleForm({ ...v, ownership: v.ownership || 'شركة' });
      setVehicleModalVisible(true);
    };

    const saveVehicle = () => {
      if (!vehicleForm.id.trim() || !vehicleForm.name.trim() || !vehicleForm.type.trim()) {
        Alert.alert('تنبيه', 'رقم السيارة واسم السيارة والنوع حقول مطلوبة.');
        return;
      }
      if (!vehicleEditId && fleet.some(v => v.id === vehicleForm.id.trim())) {
        Alert.alert('تنبيه', 'رقم السيارة موجود مسبقًا.');
        return;
      }
      const value = { ...vehicleForm, id: vehicleForm.id.trim(), name: vehicleForm.name.trim() };
      if (vehicleEditId) {
        setFleet(prev => prev.map(v => v.id === vehicleEditId ? value : v));
        if (currentUser?.role === 'driver' && currentUser.id === vehicleEditId) setCurrentUser({ role: 'driver', ...value });
      } else {
        setFleet(prev => [...prev, value]);
      }
      setVehicleModalVisible(false);
      Alert.alert('تم الحفظ', vehicleEditId ? 'تم تعديل بيانات السيارة.' : 'تمت إضافة السيارة.');
    };

    return (
      <View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.sectionTitle}>قائمة السيارات ({fleet.length})</Text>
          <TouchableOpacity style={styles.smallPrimary} onPress={openAddVehicle}><Text style={styles.btnText}>＋ إضافة سيارة</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
          {categories.map(c => (
            <TouchableOpacity key={c} style={[styles.choice, fleetCategory === c && styles.choiceActive]} onPress={() => setFleetCategory(c)}>
              <Text style={[styles.choiceText, fleetCategory === c && styles.choiceTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map(v => (
          <View key={v.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>🚗 {v.id}</Text>
              <Text style={styles.badge}>{v.status}</Text>
            </View>
            <Text style={styles.cardTitle}>{v.name}</Text>
            <Text style={styles.cardText}>السائق: {v.driver}</Text>
            <Text style={styles.cardText}>الموديل: {v.model} | السعة: {v.payload}</Text>
            <Text style={styles.cardText}>فئة النقل: {v.type} | الملكية: {v.ownership || 'شركة'}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => openEditVehicle(v)}>
                <Text style={styles.btnText}>تعديل سيارة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: v.status === 'موقف' ? COLORS.success : COLORS.danger }]}
                onPress={() => setFleet(prev => prev.map(x => x.id === v.id ? { ...x, status: x.status === 'موقف' ? 'في الخدمة' : 'موقف' } : x))}>
                <Text style={styles.btnText}>{v.status === 'موقف' ? 'تفعيل السيارة' : 'إيقاف السيارة'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Modal visible={vehicleModalVisible} transparent animationType="slide" onRequestClose={() => setVehicleModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.modalCenter,{paddingBottom:36}]}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{vehicleEditId ? 'تعديل سيارة' : 'إضافة سيارة'}</Text>
                {[
                  ['id','رقم السيارة'], ['name','اسم السيارة'], ['driver','السائق'], ['type','فئة النقل'],
                  ['model','الموديل'], ['payload','الحمولة / السعة'], ['fuelType','نوع الوقود'],
                  ['engineNo','رقم المحرك'], ['chassisNo','رقم الشاسيه']
                ].map(([key,label]) => (
                  <View key={key}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput style={styles.input}
                      value={String((vehicleForm as any)[key] || '')}
                      onChangeText={v => setVehicleForm(p => ({ ...p, [key]: v }))}
                      textAlign="right"
                    />
                  </View>
                ))}
                {renderSelect('الحالة', vehicleForm.status, ['في الخدمة','موقف'], v => setVehicleForm(p => ({ ...p, status: v })))}
                {renderSelect('الملكية', vehicleForm.ownership || 'شركة', ['شركة','خاصة'], v => setVehicleForm(p => ({ ...p, ownership: v as 'شركة' | 'خاصة' })))}
                <TouchableOpacity style={styles.primaryBtn} onPress={saveVehicle}><Text style={styles.btnText}>حفظ السيارة</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVehicleModalVisible(false)}><Text style={styles.btnText}>إلغاء</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

  const renderAssignments = () => (
    <View>
      <Text style={styles.sectionTitle}>ربط السائقين بالسيارات</Text>
      <Text style={styles.helper}>أدخل رقم السيارة، وسيتم عرض بياناتها تلقائيًا. ثم أدخل رقم السائق واختر الاسم من القائمة.</Text>

      <Text style={styles.label}>1. رقم السيارة</Text>
      <TouchableOpacity style={styles.dropdownInput} onPress={() => setVehicleDropdownVisible(true)}><Text style={{textAlign:'right',color:assignmentForm.vehicleId?COLORS.text:COLORS.muted}}>{assignmentForm.vehicleId ? `${assignmentForm.vehicleId} — ${assignmentVehicle?.name || ''}` : 'اختر السيارة من القائمة'}</Text></TouchableOpacity>
      {assignmentVehicle && (
        <View style={styles.vehicleInfoBox}>
          <Text style={styles.cardTitle}>بيانات السيارة</Text>
          <Text style={styles.cardText}>الاسم: {assignmentVehicle.name}</Text>
          <Text style={styles.cardText}>الموديل: {assignmentVehicle.model}</Text>
          <Text style={styles.cardText}>السعة: {assignmentVehicle.payload}</Text>
          <Text style={styles.cardText}>فئة النقل: {assignmentVehicle.type}</Text>
          <Text style={styles.cardText}>المالك: {assignmentVehicle.ownership || 'شركة'}</Text>
        </View>
      )}

      <Text style={styles.label}>2. رقم السائق</Text>
      <TextInput style={styles.input} value={assignmentForm.driverId}
        onChangeText={v => setAssignmentForm(p => ({ ...p, driverId: v }))}
        placeholder="أدخل رقم السائق" textAlign="right" />

      <Text style={styles.label}>اسم السائق</Text>
      <TouchableOpacity style={styles.dropdownInput} onPress={() => setDriverDropdownVisible(true)}>
        <Text style={{ textAlign: 'right', color: assignmentForm.driver ? COLORS.text : COLORS.muted }}>
          {assignmentForm.driver || 'اختر السائق من القائمة'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>3. تاريخ بداية التكليف</Text>
      <TextInput style={styles.input} value={assignmentForm.startDate}
        onChangeText={v => setAssignmentForm(p => ({ ...p, startDate: v }))}
        placeholder="YYYY-MM-DD" textAlign="right" />

      <Text style={styles.label}>تاريخ نهاية التكليف - اختياري</Text>
      <TextInput style={styles.input} value={assignmentForm.endDate}
        onChangeText={v => setAssignmentForm(p => ({ ...p, endDate: v }))}
        placeholder="اتركه فارغًا إذا كان التكليف مستمرًا" textAlign="right" />

      <Text style={styles.label}>4. الملاحظات</Text>
      <TextInput style={[styles.input, { minHeight: 75 }]} value={assignmentForm.notes}
        onChangeText={v => setAssignmentForm(p => ({ ...p, notes: v }))}
        multiline textAlign="right" />

      <TouchableOpacity style={styles.primaryBtn} onPress={() => {
        if (!assignmentVehicle) { Alert.alert('تنبيه', 'السيارة غير موجودة.'); return; }
        if (!assignmentForm.driverId.trim() || !assignmentForm.driver) { Alert.alert('تنبيه', 'أدخل رقم السائق واختر اسم السائق.'); return; }
        if (!assignmentForm.startDate.trim()) { Alert.alert('تنبيه', 'أدخل تاريخ بداية التكليف.'); return; }
        setAssignments(prev => [...prev, { ...assignmentForm, id: `ASG-${Date.now()}` }]);
        setAssignmentForm({ id:'', driver:'', driverId:'', vehicleId:'', startDate:TODAY(), endDate:'', notes:'' });
        Alert.alert('تم الحفظ', 'تم ربط السائق بالسيارة.');
      }}>
        <Text style={styles.btnText}>5. حفظ التكليف</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPermissions = () => {
    const permissionLabels: Array<[keyof PermissionSet, string]> = [
      ['addVehicle','إضافة سيارة'], ['editVehicle','تعديل بيانات سيارة'],
      ['assignVehicle','ربط السائقين بالسيارات'], ['addDriver','إضافة سائق'],
      ['editDriver','تعديل بيانات سائق'], ['editCodings','إضافة وتعديل التكويدات بجميع أنواعها'],
      ['editPrices','إضافة وتعديل الأسعار'], ['changePassword','تغيير كلمة المرور'],
      ['reports','التقارير'], ['requestService','طلبات الخدمات'], ['fuel','وقود'],
      ['oils','زيوت'], ['batteries','بطاريات'], ['parts','قطع غيار'],
      ['maintenance','صيانة'], ['tires','إطارات'],
    ];
    return (
      <View>
        <Text style={styles.sectionTitle}>الصلاحيات</Text>
        <Text style={styles.helper}>إدارة صلاحيات السيارات والسائقين.</Text>
        {fleet.map(v => {
          const p = getPermission(v.id);
          return (
            <View key={v.id} style={styles.card}>
              <Text style={styles.cardTitle}>{v.id} - {v.driver}</Text>
              {permissionLabels.map(([key,label]) => (
                <View key={String(key)} style={styles.switchRow}>
                  <Switch value={!!p[key]} onValueChange={value => setVehiclePermission(v.id,key,value)} />
                  <Text style={styles.switchLabel}>{label}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderReports = (isAdmin = false) => {
    let rows = isAdmin ? requests : requests.filter(r => r.vehicleId === currentUser?.id);
    if (reportType !== 'الكل') rows = rows.filter(r => r.type === reportType);
    if (reportFrom) rows = rows.filter(r => r.date >= reportFrom);
    if (reportTo) rows = rows.filter(r => r.date <= reportTo);
    const total = rows.reduce((s,r) => s + Number(r.total || 0), 0);

    return (
      <View>
        <Text style={styles.sectionTitle}>{isAdmin ? 'التقارير' : 'تقارير الطلبات'}</Text>
        <View style={styles.filterBox}>
          {renderSelect('نوع الطلب', reportType, ['الكل', ...requestTypes], setReportType)}
          <Text style={styles.label}>من تاريخ</Text>
          <TextInput style={styles.input} value={reportFrom} onChangeText={setReportFrom} placeholder="YYYY-MM-DD" textAlign="right" />
          <Text style={styles.label}>إلى تاريخ</Text>
          <TextInput style={styles.input} value={reportTo} onChangeText={setReportTo} placeholder="YYYY-MM-DD" textAlign="right" />
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي المصاريف والطلبات</Text>
          <Text style={styles.summaryValue}>{money(total)}</Text>
          <Text style={styles.summarySub}>{rows.length} عملية</Text>
        </View>

        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>{r.id}</Text>
              <Text style={styles.badge}>{r.status}</Text>
            </View>
            <Text style={styles.cardTitle}>{r.type}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date} | الكمية: {r.qty}</Text>
            <Text style={styles.cardText}>التكلفة: {money(r.total)}</Text>
            <Text style={styles.cardText}>النوع: {r.fuelType || r.oilType || r.itemName || r.type}</Text>
            <Text style={styles.workflowTitle}>المرحلة الحالية: {r.workflow || 'المسؤول المباشر'}</Text>
            {(r.approvalTrail || []).map((step:string,i:number)=><Text key={`${r.id}-trail-${i}`} style={styles.cardText}>• {step}</Text>)}
          </View>
        ))}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.success }]} onPress={() => exportExcel(rows, isAdmin ? 'admin-report' : 'my-report')}>
            <Text style={styles.btnText}>تصدير Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.primary }]} onPress={() => exportPdf(rows, isAdmin ? 'التقرير العام' : 'تقرير مصاريف السيارة')}>
            <Text style={styles.btnText}>تصدير PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRequestModal = () => {
    if (!serviceTypeModal) return null;
    const price = currentUnitPrice();
    const qty = Number(reqQty) || 0;
    const prev = lastOdometer(currentUser?.id || '');
    const isDispatch = serviceTypeModal === 'إرسالية صيانة' || serviceTypeModal === 'إرسالية بنشر وخدمات';
    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setServiceTypeModal(null); resetRequestForm(); }}>
        <SafeAreaView style={styles.requestModalScreen}>
          <View style={styles.requestModalHeader}><Text style={styles.modalTitle}>طلب {serviceTypeModal}</Text><TouchableOpacity onPress={() => { setServiceTypeModal(null); resetRequestForm(); }}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity></View>
          <ScrollView style={styles.requestFormScroll} contentContainerStyle={styles.requestFormContent} keyboardShouldPersistTaps="handled">
            <View style={styles.infoPill}><Text style={styles.infoPillText}>العملية: {getNextRequestId()}</Text><Text style={styles.infoPillText}>التاريخ: {TODAY()}</Text></View>
            {serviceTypeModal === 'إرسالية صيانة' ? <>
              <Text style={styles.label}>رقم السيارة</Text><TextInput style={styles.readOnlyInput} value={currentUser?.id || ''} editable={false} textAlign="right" />
              <Text style={styles.label}>السائق</Text><TextInput style={styles.readOnlyInput} value={currentUser?.driver || ''} editable={false} textAlign="right" />
              {renderSelect('الورشة', selectedWorkshop, workshops, setSelectedWorkshop)}
              {renderSelect('المهندس', selectedEngineer, engineers, setSelectedEngineer)}
              <Text style={styles.label}>نوع العطل</Text><TextInput style={styles.input} value={faultType} onChangeText={setFaultType} textAlign="right" placeholder="اكتب نوع العطل" />
              <Text style={styles.label}>العمل المطلوب</Text><TextInput style={[styles.input,{minHeight:90}]} value={requiredWork} onChangeText={setRequiredWork} multiline textAlign="right" placeholder="اكتب العمل المطلوب" />
            </> : serviceTypeModal === 'إرسالية بنشر وخدمات' ? <>
              <Text style={styles.label}>رقم العملية</Text><TextInput style={styles.readOnlyInput} value={getNextRequestId()} editable={false} textAlign="right" />
              <Text style={styles.label}>التاريخ</Text><TextInput style={styles.readOnlyInput} value={TODAY()} editable={false} textAlign="right" />
              <Text style={styles.label}>رقم السيارة</Text><TextInput style={styles.readOnlyInput} value={currentUser?.id || ''} editable={false} textAlign="right" />
              {renderSelect('العميل', selectedClient, clients, setSelectedClient)}
              <Text style={styles.label}>الخدمة</Text><TextInput style={[styles.input,{minHeight:90}]} value={serviceDescription} onChangeText={setServiceDescription} multiline textAlign="right" placeholder="اكتب الخدمة المطلوبة" />
            </> : <>
              {serviceTypeModal === 'وقود' && <>{renderSelect('المحطة', selectedStation, stations, setSelectedStation)}{renderSelect('نوع الوقود', selectedFuel, fuelTypes, setSelectedFuel)}</>}
              {serviceTypeModal === 'زيوت' && <>{renderSelect('نوع الزيت', selectedOil, oils, setSelectedOil)}{renderSelect('الوحدة', selectedUnit, ['دبة','علبة','جالون'], setSelectedUnit)}<Text style={styles.label}>العداد السابق</Text><TextInput style={styles.readOnlyInput} value={String(prev)} editable={false} textAlign="right" /><Text style={styles.label}>العداد الحالي</Text><TextInput style={styles.input} keyboardType="numeric" value={currOdometer} onChangeText={setCurrOdometer} textAlign="right" /><Text style={styles.calcText}>المسافة المقطوعة: {Math.max(0,(Number(currOdometer)||prev)-prev).toLocaleString()} كم</Text></>}
              {serviceTypeModal === 'بطاريات' && renderSelect('نوع البطارية', selectedBattery, batteries, setSelectedBattery)}
              {serviceTypeModal === 'قطع غيار' && renderSelect('قطعة الغيار', selectedPart, parts, setSelectedPart)}
              {serviceTypeModal === 'إطارات' && renderSelect('نوع الإطار', selectedTire, tires, setSelectedTire)}
              {serviceTypeModal === 'صيانة' && <>{renderSelect('نوع الصيانة', selectedMaintenance, maintenanceItems, setSelectedMaintenance)}{renderSelect('الورشة', selectedWorkshop, workshops, setSelectedWorkshop)}{renderSelect('المهندس', selectedEngineer, engineers, setSelectedEngineer)}<Text style={styles.label}>نوع العطل</Text><TextInput style={styles.input} value={faultType} onChangeText={setFaultType} textAlign="right" /><Text style={styles.label}>العمل المطلوب</Text><TextInput style={[styles.input,{minHeight:70}]} value={requiredWork} onChangeText={setRequiredWork} multiline textAlign="right" /></>}
              {!isDispatch && <><Text style={styles.label}>الكمية</Text><TextInput style={styles.input} keyboardType="numeric" value={reqQty} onChangeText={setReqQty} placeholder="أدخل الكمية" textAlign="right" />{price > 0 && <Text style={styles.totalText}>الإجمالي التقديري: {money(qty * price)}</Text>}</>}
            </>}
            <Text style={styles.label}>الملاحظات</Text><TextInput style={[styles.input,{minHeight:75}]} value={reqNotes} onChangeText={setReqNotes} multiline textAlign="right" />
            <TouchableOpacity style={styles.secondaryBtn} onPress={openImagePicker}><Text style={styles.btnText}>📷 إرفاق صورة لهذا الطلب</Text></TouchableOpacity>
            {reqImage ? <View><Image source={{ uri: reqImage }} style={styles.previewImage} /><TouchableOpacity onPress={()=>setReqImage(undefined)}><Text style={styles.deleteText}>إزالة المرفق</Text></TouchableOpacity></View> : null}
          </ScrollView>
          <View style={styles.requestFooter}><TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.primary}]} onPress={submitRequest}><Text style={styles.btnText}>إرسال الطلب</Text></TouchableOpacity><TouchableOpacity style={[styles.actionBtn,{backgroundColor:'#64748B'}]} onPress={() => { setServiceTypeModal(null); resetRequestForm(); }}><Text style={styles.btnText}>إلغاء</Text></TouchableOpacity></View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginSubtitle}>تسجيل الدخول (متصل سحابياً)</Text>
          <TextInput style={styles.input} placeholder="اسم المستخدم / رقم السيارة" placeholderTextColor="#94A3B8"
            value={username} onChangeText={setUsername} textAlign="right" />
          <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#94A3B8"
            secureTextEntry value={password} onChangeText={setPassword} textAlign="right" />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}><Text style={styles.btnText}>دخول</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (currentUser.role === 'admin') {
    const adminNav = [
      ['requests','📋','الطلبات'], ['coding','🧩','التكويدات'], ['pricing','💰','الأسعار'],
      ['fleet','🚗','قائمة السيارات'], ['assignments','🔗','ربط السائقين'],
      ['permissions','🔐','الصلاحيات'], ['control','🎛️','التحكم'], ['notifications','🔔','الإشعارات'], ['reports','📊','التقارير'],
    ];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerTitle}>لوحة المسؤول</Text>
            <Text style={styles.headerSub}>مرحبًا، {currentUser.name}</Text>
          </View>
          <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>م</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adminNav} contentContainerStyle={{flexDirection:'row-reverse'}}>
          {adminNav.map(([key,icon,label]) => (
            <TouchableOpacity key={key} onPress={() => setAdminTab(key)}
              style={[styles.adminTab, adminTab === key && styles.adminTabActive]}>
              <Text style={styles.adminIcon}>{icon}</Text>
              <Text style={[styles.adminTabText, adminTab === key && styles.adminTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:110}}>
          {adminTab === 'requests' ? renderRequestsAdmin() : null}
          {adminTab === 'coding' ? renderCoding() : null}
          {adminTab === 'pricing' ? renderPricing() : null}
          {adminTab === 'fleet' ? renderFleet() : null}
          {adminTab === 'assignments' ? renderAssignments() : null}
          {adminTab === 'permissions' ? renderPermissions() : null}
          {adminTab === 'reports' ? renderReports(true) : null}
          {adminTab === 'control' ? <View><Text style={styles.sectionTitle}>لوحة التحكم</Text><Text style={styles.helper}>إعدادات النظام والمسارات والدعم السحابي.</Text></View> : null}
          {adminTab === 'notifications' ? <View><Text style={styles.sectionTitle}>الإشعارات</Text><TextInput style={styles.input} value={noticeTitle} onChangeText={setNoticeTitle} placeholder="عنوان الإشعار" textAlign="right"/><TextInput style={[styles.input,{minHeight:90}]} value={noticeBody} onChangeText={setNoticeBody} placeholder="نص الإشعار" multiline textAlign="right"/><TouchableOpacity style={styles.primaryBtn} onPress={()=>{if(!noticeTitle.trim()||!noticeBody.trim()){Alert.alert('تنبيه','أدخل العنوان والنص');return;}setNotifications(prev=>[{id:`NTF-${Date.now()}`,title:noticeTitle,body:noticeBody,date:TODAY(),target:'الكل'},...prev]);setNoticeTitle('');setNoticeBody('');Alert.alert('تم','أضيف الإشعار.');}}><Text style={styles.btnText}>إرسال الإشعار</Text></TouchableOpacity></View> : null}
        </ScrollView>

        <TouchableOpacity style={styles.logoutBar} onPress={handleLogout}><Text style={styles.btnText}>تسجيل الخروج</Text></TouchableOpacity>

        <Modal visible={!!codingModal} transparent animationType="slide" onRequestClose={() => setCodingModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>تكويد {codingModal}</Text>
              <TextInput style={styles.input} value={newItem} onChangeText={setNewItem} placeholder="اسم العنصر" textAlign="right" />
              <TouchableOpacity style={styles.primaryBtn} onPress={saveCodingItem}>
                <Text style={styles.btnText}>إضافة عنصر</Text>
              </TouchableOpacity>
              <ScrollView style={{maxHeight:320}}>
                {codingModal ? codingMap[codingModal].map((item,index) => (
                  <View key={`${item}-${index}`} style={styles.inlineRow}>
                    <Text style={{flex:1,textAlign:'right'}}>{item}</Text>
                    <TouchableOpacity onPress={() => deleteCodingItem(codingModal,index)}>
                      <Text style={styles.deleteText}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                )) : null}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCodingModal(null)}><Text style={styles.btnText}>إغلاق</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>السيارة {currentUser.id}</Text>
          <Text style={styles.headerSub}>{currentUser.driver}</Text>
        </View>
        <View style={styles.headerAvatar}><Text style={{fontSize:22}}>🚗</Text></View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:110}}>
        {userTab === 'service' && (
          <View>
            <Text style={styles.sectionTitle}>الخدمات والطلبات</Text>
            {requestTypes.map((type,index) => (
              <TouchableOpacity key={type} style={styles.serviceCard} onPress={() => openServiceRequest(type)}>
                <View style={styles.serviceIcon}><Text style={{fontSize:25}}>{['⛽','🛢️','🔋','🔧','🛠️','🛞','📦','🧰'][index]}</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.serviceTitle}>طلب {type}</Text>
                  <Text style={styles.serviceSub}>إنشاء طلب جديد وإرفاق المستندات</Text>
                </View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.serviceCard} onPress={() => setUserTab('reports')}><View style={styles.serviceIcon}><Text style={{fontSize:24}}>📊</Text></View><View style={{flex:1}}><Text style={styles.serviceTitle}>التقارير</Text><Text style={styles.serviceSub}>إجمالي وتفصيلي حسب الطلبات</Text></View></TouchableOpacity>
          </View>
        )}

        {userTab === 'my_requests' && (<View><Text style={styles.sectionTitle}>تقارير طلباتي</Text>{requests.filter(r=>r.vehicleId===currentUser.id).map(r=><View key={r.id} style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View><Text style={styles.cardTitle}>{r.type}</Text><Text style={styles.cardText}>التاريخ: {r.date} | الكمية: {r.qty}</Text><Text style={styles.cardText}>المرحلة الحالية: {r.workflow || 'المسؤول المباشر'}</Text></View>)}</View>)}
        {userTab === 'reports' ? renderReports(false) : null}
      </ScrollView>

      <View style={styles.driverNav}>
        {[
          ['service','🏠','الرئيسية'], ['my_requests','📋','طلباتي'], ['reports','📊','التقارير']
        ].map(([key,icon,label]) => (
          <TouchableOpacity key={key} style={styles.driverNavItem} onPress={() => setUserTab(key)}>
            <Text style={{fontSize:18}}>{icon}</Text>
            <Text style={[styles.driverNavText,userTab === key && styles.activeNavText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderRequestModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.bg},
  loginContainer:{flex:1,backgroundColor:COLORS.bg,justifyContent:'center',alignItems:'center',padding:20},
  loginCard:{width:'100%',maxWidth:400,backgroundColor:'#fff',borderRadius:24,padding:26,elevation:5},
  loginSubtitle:{textAlign:'center',fontSize:20,fontWeight:'800',color:COLORS.text,marginBottom:22},
  input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
  primaryBtn:{backgroundColor:COLORS.primary,borderRadius:12,padding:13,alignItems:'center',marginTop:6},
  secondaryBtn:{backgroundColor:COLORS.primaryDark,borderRadius:12,padding:12,alignItems:'center',marginTop:10},
  btnText:{color:'#fff',fontWeight:'800',textAlign:'center'},
  topHeader:{backgroundColor:COLORS.primary,paddingHorizontal:18,paddingVertical:15,flexDirection:'row-reverse',alignItems:'center',gap:12},
  headerAvatar:{width:44,height:44,borderRadius:22,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},
  headerAvatarText:{color:COLORS.primary,fontSize:20,fontWeight:'800'},
  headerTitle:{color:'#fff',fontSize:19,fontWeight:'800',textAlign:'right'},
  headerSub:{color:'#FDE7E8',fontSize:13,textAlign:'right',marginTop:2},
  adminNav:{backgroundColor:'#fff',maxHeight:70,borderBottomWidth:1,borderBottomColor:COLORS.border},
  adminTab:{paddingHorizontal:12,paddingVertical:8,borderBottomWidth:3,borderBottomColor:'transparent',alignItems:'center',minWidth:82},
  adminTabActive:{borderBottomColor:COLORS.primary},
  adminTabText:{color:COLORS.muted,fontWeight:'700',fontSize:11,textAlign:'center'},
  adminTabTextActive:{color:COLORS.primary},
  adminIcon:{fontSize:18,marginBottom:2},
  content:{flex:1,padding:15},
  sectionTitle:{fontSize:20,fontWeight:'800',color:COLORS.text,textAlign:'right',marginBottom:8},
  helper:{textAlign:'right',color:COLORS.muted,fontSize:13,marginBottom:12},
  card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:11,borderWidth:1,borderColor:'#EEF2F7'},
  cardHeader:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  cardId:{color:COLORS.primary,fontWeight:'800',fontSize:15},
  cardTitle:{textAlign:'right',fontWeight:'800',fontSize:16,color:COLORS.text,marginBottom:5},
  cardText:{textAlign:'right',color:'#475569',marginBottom:4},
  badge:{backgroundColor:'#FFF4E5',color:'#9A5B00',paddingHorizontal:9,paddingVertical:4,borderRadius:10,fontSize:12,fontWeight:'700'},
  actionRow:{flexDirection:'row-reverse',gap:8,marginTop:10},
  actionBtn:{flex:1,borderRadius:10,padding:11,alignItems:'center'},
  logoutBar:{backgroundColor:'#7F1D1D',padding:13,alignItems:'center'},
  menuCard:{backgroundColor:'#fff',borderRadius:16,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7'},
  menuIcon:{width:46,height:46,borderRadius:14,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  menuIconText:{fontSize:22},
  menuTitle:{textAlign:'right',fontWeight:'800',fontSize:15,color:COLORS.text},
  menuSub:{textAlign:'right',fontSize:12,color:COLORS.muted,marginTop:3},
  chevron:{fontSize:30,color:COLORS.primary,fontWeight:'300'},
  field:{marginBottom:8},
  label:{textAlign:'right',fontWeight:'700',fontSize:13,color:'#475569',marginBottom:5,marginTop:4},
  choiceRow:{flexDirection:'row-reverse',gap:7,paddingVertical:2},
  choice:{borderWidth:1,borderColor:COLORS.border,borderRadius:10,paddingHorizontal:12,paddingVertical:8,backgroundColor:'#fff'},
  choiceActive:{backgroundColor:'#FFF0F1',borderColor:COLORS.primary},
  choiceText:{color:'#475569',fontSize:13},
  choiceTextActive:{color:COLORS.primary,fontWeight:'800'},
  priceRow:{backgroundColor:'#fff',borderRadius:12,padding:10,marginBottom:7,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},
  priceInput:{width:120,borderWidth:1,borderColor:COLORS.border,borderRadius:10,padding:9,textAlign:'right',backgroundColor:'#F8FAFC'},
  pageHeaderRow:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',marginBottom:8},
  smallPrimary:{backgroundColor:COLORS.primary,borderRadius:10,padding:9},
  summaryCard:{backgroundColor:COLORS.primary,borderRadius:18,padding:18,marginBottom:12},
  summaryTitle:{color:'#FDE7E8',textAlign:'right',fontWeight:'700'},
  summaryValue:{color:'#fff',textAlign:'right',fontSize:26,fontWeight:'900',marginTop:5},
  summarySub:{color:'#FDE7E8',textAlign:'right',marginTop:3},
  exportBtn:{flex:1,borderRadius:10,padding:12,alignItems:'center'},
  switchRow:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:'#F1F5F9',paddingVertical:7},
  switchLabel:{flex:1,textAlign:'right',color:'#334155',marginRight:8},
  inlineRow:{flexDirection:'row-reverse',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#EEF2F7',gap:10},
  deleteText:{color:COLORS.danger,fontWeight:'800'},
  modalOverlay:{flex:1,backgroundColor:'rgba(15,23,42,.55)',justifyContent:'center'},
  modalCenter:{padding:16,justifyContent:'center'},
  modalContent:{backgroundColor:'#fff',borderRadius:20,padding:18,maxHeight:'92%'},
  modalTitle:{textAlign:'right',fontSize:20,fontWeight:'900',color:COLORS.text,marginBottom:12},
  infoPill:{flexDirection:'row-reverse',justifyContent:'space-between',backgroundColor:'#F8FAFC',borderRadius:10,padding:10,marginBottom:8},
  infoPillText:{color:COLORS.muted,fontSize:12,fontWeight:'700'},
  calcText:{color:COLORS.primary,fontWeight:'800',textAlign:'right',marginBottom:8},
  totalText:{color:COLORS.primary,fontSize:18,fontWeight:'900',textAlign:'right',marginVertical:8},
  previewImage:{width:110,height:110,borderRadius:12,alignSelf:'flex-end',marginVertical:8},
  serviceCard:{backgroundColor:'#fff',borderRadius:18,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7'},
  serviceIcon:{width:55,height:55,borderRadius:17,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  serviceTitle:{textAlign:'right',fontWeight:'900',fontSize:16,color:COLORS.text},
  serviceSub:{textAlign:'right',color:COLORS.muted,fontSize:12,marginTop:3},
  driverNav:{flexDirection:'row-reverse',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.border,paddingVertical:7},
  driverNavItem:{flex:1,alignItems:'center',paddingVertical:7},
  driverNavText:{color:'#64748B',fontSize:11,fontWeight:'600'},
  activeNavText:{color:COLORS.primary,fontWeight:'900'},
  filterBox:{backgroundColor:'#fff',borderRadius:15,padding:12,marginBottom:10},
  workflowTitle:{textAlign:'right',fontWeight:'800',color:COLORS.primary,marginTop:7},
  vehicleInfoBox:{backgroundColor:'#F8FAFC',borderRadius:14,padding:12,marginBottom:10,borderWidth:1,borderColor:COLORS.border},
  emptyCard:{backgroundColor:'#fff',borderRadius:16,padding:22,alignItems:'center',marginBottom:12},
  emptyText:{color:COLORS.muted,fontWeight:'700',textAlign:'center'},
  mutedRight:{textAlign:'right',color:COLORS.muted,fontSize:12,marginTop:6},
  requestImage:{width:170,height:170,borderRadius:14,alignSelf:'flex-end',marginTop:10},
  requestModalScreen:{flex:1,backgroundColor:COLORS.bg},
  requestModalHeader:{backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:12,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:COLORS.border},
  closeText:{color:COLORS.primary,fontWeight:'900',fontSize:14},
  requestFormScroll:{flex:1},
  requestFormContent:{padding:16,paddingBottom:30},
  requestFooter:{backgroundColor:'#fff',padding:10,borderTopWidth:1,borderTopColor:COLORS.border,flexDirection:'row-reverse',gap:8},
  readOnlyInput:{backgroundColor:'#E2E8F0',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
});

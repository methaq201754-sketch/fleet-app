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

// Supabase Integration Setup & Keys
const SUPABASE_URL = "https://zsxndqxhgirwrtmhsngx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzeG5kcXhoZ2lyd3J0bWhzbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MjIxMjksImV4cCI6MjEwNzI5ODEyOX0.g0jM3FppnlUYhVluTpjnK56XUOkIeWvpO4cl_I_Um1k";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

const APP_VERSION = '1.70.30';
const APP_BUILD = '70';
const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F4F7FB', card: '#FFFFFF', text: '#263238', muted: '#718096',
  border: '#E2E8F0', success: '#2E7D32', warning: '#ED8B00', danger: '#C62828',
};

type Vehicle = {
  id: string; carNumber: string; name: string; driver: string; status: string; type: string;
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
  startDate?: string; endDate?: string; returnDate?: string; daysCount?: number;
  destination?: string; custody?: number;
  directManagerStatus?: string;
  servicesStatus?: string;
  applicantId?: string;
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
  
  const [fleet, setFleet] = useState<Vehicle[]>([]);
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
  
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionSet>>({});
  
  const [requestManagersTab, setRequestManagersTab] = useState('list');
  const [managerProfiles, setManagerProfiles] = useState<any[]>([]);
  const [workflowRoutes, setWorkflowRoutes] = useState<string[]>(['المسؤول المباشر', 'الخدمات الإدارية', 'المسؤول النهائي']);
  const [newRouteName, setNewRouteName] = useState('');
  const [userTab, setUserTab] = useState('service');
  const [adminTab, setAdminTab] = useState('requests');
  const [loadingDb, setLoadingDb] = useState(false);
  
  const [tripTypes, setTripTypes] = useState<string[]>(['مهمة عمل','توصيل مواد','مراجعة جهة']);
  const [tripDestinations, setTripDestinations] = useState<string[]>(['صنعاء','عدن','الحديدة','إب','ذمار','رداع']);
  
  const [adminRequestTab, setAdminRequestTab] = useState('وقود');
  const [pricingCategoryModal, setPricingCategoryModal] = useState<string | null>(null);
  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  const [codingModal, setCodingModal] = useState<string | null>(null);
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
  const [reportType, setReportType] = useState('الكل');
  
  const [subView, setSubView] = useState<'report' | 'create'>('report');
  const [darkMode, setDarkMode] = useState(false);
  const [ownershipTypes, setOwnershipTypes] = useState<string[]>(['شركة','خاصة']);
  
  // حقول البحث الجديدة لربط السائقين بالسيارات
  const [assignmentSearchCar, setAssignmentSearchCar] = useState('');
  const [assignmentSearchDriver, setAssignmentSearchDriver] = useState('');
  const [assignmentStartDate, setAssignmentStartDate] = useState(TODAY());
  const [assignmentEndDate, setAssignmentEndDate] = useState('');

  // شاشات فرعية لنوع الإرساليات الجديدة
  const [maintenanceServiceSubModal, setMaintenanceServiceSubModal] = useState<'صيانة' | 'بنشر' | null>(null);

  const codingMap: Record<string, string[]> = {
    'المحروقات': fuelTypes, 'الزيوت': oils, 'البطاريات': batteries, 'قطع الغيار': parts,
    'الإطارات': tires, 'المحطات': stations, 'الصيانة': maintenanceItems,
    'الورش': workshops, 'العملاء': clients, 'المهندسين': engineers, 'مالك السيارة': ownershipTypes,
    'نوع المهمة': tripTypes, 'الوجهة/المنطقة': tripDestinations,
  };
  const codingSetters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
    'المحروقات': setFuelTypes, 'الزيوت': setOils, 'البطاريات': setBatteries,
    'قطع الغيار': setParts, 'الإطارات': setTires, 'المحطات': setStations,
    'الصيانة': setMaintenanceItems, 'الورش': setWorkshops, 'العملاء': setClients,
    'المهندسين': setEngineers, 'مالك السيارة': setOwnershipTypes, 'نوع المهمة': setTripTypes,
    'الوجهة/المنطقة': setTripDestinations,
  };

  const [assignmentForm, setAssignmentForm] = useState<Assignment>({
    id: '', driver: '', driverId: '', vehicleId: '', startDate: TODAY(), endDate: '', notes: '',
  });
  const [driverDropdownVisible, setDriverDropdownVisible] = useState(false);
  const [vehicleDropdownVisible, setVehicleDropdownVisible] = useState(false);
  const [fleetCategory, setFleetCategory] = useState('جميع السيارات');
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleEditId, setVehicleEditId] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Vehicle>({
    id: '', carNumber: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
    payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة'
  });

  const parseStoredNotes = (raw: any) => {
    const text = String(raw || '');
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.__fleetApp === true) return parsed;
    } catch (_) {}
    return { __fleetApp: true, appNotes: text, appFields: {} };
  };

  const makeStoredNotes = (item: RequestItem) => JSON.stringify({
    __fleetApp: true,
    appNotes: item.notes || '',
    appFields: {
      fuelType: item.fuelType, oilType: item.oilType, itemName: item.itemName,
      prevOdo: item.prevOdo, currOdo: item.currOdo, distance: item.distance,
      workshop: item.workshop, engineer: item.engineer, faultType: item.faultType,
      requiredWork: item.requiredWork, client: item.client,
      serviceDescription: item.serviceDescription, approvalTrail: item.approvalTrail,
      destination: item.destination, startDate: item.startDate, endDate: item.endDate,
      returnDate: item.returnDate, daysCount: item.daysCount, custody: item.custody,
      imageUri: item.imageUri
    }
  });

  const loadSupabaseData = async () => {
    try {
      setLoadingDb(true);
      const { data: vData, error: vError } = await supabase.from('vehicles').select('*');
      if (!vError && vData) {
        const mappedFleet: Vehicle[] = (vData || []).map((v: any) => {
          const carNo = String(v.car_number || '').trim();
          return {
            id: String(v.id),
            carNumber: carNo,
            name: v.car_name || `سيارة ${carNo}`,
            driver: v.driver || '',
            status: v.status || 'في الخدمة',
            type: v.brand || 'سيارة',
            model: String(v.model || v.manufacturing_year || ''),
            payload: v.load_capacity || '',
            fuelType: v.fuel_type || 'ديزل',
            engineNo: v.engine_number || '',
            chassisNo: v.chassis_number || '',
            ownership: v.ownership === 'خاصة' ? 'خاصة' : 'شركة'
          };
        });
        setFleet(mappedFleet);
      }
      const { data: rData, error: rError } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
      if (!rError && rData) {
        const mappedReqs: RequestItem[] = (rData || []).map((r: any) => {
          const stored = parseStoredNotes(r.notes);
          const extra = stored.appFields || {};
          const stage = r.status === 'مرفوض' ? 'تم رفض الطلب'
            : r.status === 'تمت الموافقة' ? 'تمت الموافقة'
            : (r.direct_manager_status === 'موافق')
              ? ((r.services_status === 'موافق') ? 'المسؤول' : 'الخدمات الإدارية')
              : 'المسؤول المباشر';
          return {
            id: String(r.id), vehicleId: String(r.vehicle_id || ''), driver: r.driver_name || '',
            type: r.service_type || 'خدمة', date: String(r.request_date || r.created_at || TODAY()).slice(0, 10),
            qty: Number(r.quantity || 0), total: Number(r.total || 0), status: r.status || 'تحت المراجعة',
            notes: stored.appNotes || '', station: r.station || '', unit: r.unit || '',
            currOdo: r.odometer == null ? undefined : Number(r.odometer), workflow: stage,
            imageUri: extra.imageUri, fuelType: extra.fuelType, oilType: extra.oilType,
            itemName: extra.itemName, prevOdo: extra.prevOdo, distance: extra.distance,
            workshop: extra.workshop, engineer: extra.engineer, faultType: extra.faultType,
            requiredWork: extra.requiredWork, client: extra.client, serviceDescription: extra.serviceDescription,
            approvalTrail: extra.approvalTrail || [], destination: extra.destination,
            startDate: extra.startDate, endDate: extra.endDate, returnDate: extra.returnDate,
            daysCount: extra.daysCount, custody: extra.custody,
            directManagerStatus: r.direct_manager_status || 'تحت المراجعة',
            servicesStatus: r.services_status || 'تحت المراجعة',
            applicantId: r.applicant_id || ''
          };
        });
        setRequests(mappedReqs);
      }
      const { data: pData } = await supabase.from('profiles').select('*');
      if (pData) setManagerProfiles(pData);
    } catch (e: any) {
      console.log('Supabase Fetch Error:', e?.message || e);
    } finally {
      setLoadingDb(false);
    }
  };

  // التحقق التلقائي من الجلسة المخزنة لضمان عدم الخروج عند إعادة فتح التطبيق (النقطة رقم 3)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserProfileAndRestore(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfileAndRestore(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    loadSupabaseData();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfileAndRestore = async (user: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles').select('id, username, full_name, role, phone, is_active')
        .eq('id', user.id).maybeSingle();
      
      if (!profile) return;
      const roleRaw = String(profile.role || '').toLowerCase();
      const isAdmin = ['admin', 'administrator', 'manager', 'services_manager', 'direct_manager', 'مسؤول', 'مدير', 'مدير عام', 'مدير الخدمات', 'مسؤول الخدمات'].includes(roleRaw);
      
      if (isAdmin) {
        setCurrentUser({ role: roleRaw === 'admin' ? 'admin' : 'manager', authId: user.id, username: profile.username, name: profile.full_name || profile.username, profile });
      } else {
        const carNumber = String(profile.username || '');
        const { data: vehicle } = await supabase.from('vehicles').select('*').eq('car_number', carNumber).maybeSingle();
        
        const v: Vehicle = {
          id: String(vehicle?.id || ''),
          carNumber: String(vehicle?.car_number || carNumber),
          name: vehicle?.car_name || `سيارة ${carNumber}`,
          driver: profile.full_name || '', 
          status: 'في الخدمة', 
          type: vehicle?.brand || 'سيارة',
          model: String(vehicle?.model || vehicle?.manufacturing_year || ''), 
          payload: vehicle?.load_capacity || '',
          fuelType: vehicle?.fuel_type || 'ديزل', 
          engineNo: vehicle?.engine_number || '', 
          chassisNo: vehicle?.chassis_number || '', 
          ownership: 'شركة'
        };
        setCurrentUser({ role: 'driver', authId: user.id, username: profile.username, id: v.carNumber, ...v, profile });
        setEditDriverName(v.driver);
      }
    } catch (err) {
      console.log('Restore session error:', err);
    }
  };

  const getPermission = (vehicleId: string): PermissionSet =>
    permissions[vehicleId] || DEFAULT_PERMISSIONS;

  const lastOdometer = (vehicleId: string) => {
    const rows = requests.filter(r => r.vehicleId === vehicleId && r.type === 'زيوت' && r.currOdo != null);
    return rows.length ? Number(rows[0].currOdo) || 0 : 0;
  };

  const driverNames = useMemo(
    () => Array.from(new Set(fleet.map(v => v.driver).filter(Boolean))),
    [fleet]
  );

  const assignmentVehicle = fleet.find(v => v.carNumber === assignmentForm.vehicleId.trim());

  const handleLogin = async () => {
    const u = username.trim(), p = password.trim();
    if (!u || !p) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المستخدم أو رقم السيارة وكلمة المرور');
      return;
    }
    try {
      setLoadingDb(true);
      const loginEmails: Record<string, string> = {
        'ميثاق2': 'methaq2@fleet-login.example.com',
        'عبدالله2': 'abdullah2@fleet-login.example.com',
        'بادر2': 'bader2@fleet-login.example.com',
        'سعيد2': 'saeed2@fleet-login.example.com',
      };
      const email = u.includes('@')
        ? u.toLowerCase()
        : loginEmails[u] || `${u.toLowerCase()}@fleet-login.example.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: p,
      });
      
      if (error || !data.user) {
        Alert.alert('تعذر تسجيل الدخول', 'تأكد من صحة بيانات الدخول أو كلمة المرور.');
        return;
      }
      await fetchUserProfileAndRestore(data.user);
      setUsername(''); setPassword('');
    } catch (e: any) {
      Alert.alert('خطأ في تسجيل الدخول', e?.message || 'تعذر الاتصال بخدمة تسجيل الدخول.');
    } finally {
      setLoadingDb(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    setMaintenanceServiceSubModal(null);
  };

  const openServiceRequest = (type: string) => {
    resetRequestForm();
    if (type === 'إرسالية صيانة وخدمات') {
      setMaintenanceServiceSubModal('صيانة');
    } else {
      setServiceTypeModal(type);
    }
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
    if (!currentUser.authId) { Alert.alert('تسجيل الدخول مطلوب', 'أعد تسجيل الدخول قبل إرسال الطلب.'); return; }
    
    const tempId = `REQ-${Date.now().toString().slice(-6)}`;
    const item: RequestItem = {
      id: tempId, vehicleId: currentUser.id, driver: currentUser.driver || currentUser.name || '',
      type: serviceTypeModal, date: TODAY(), qty: 1, total: 0,
      status: 'تحت المراجعة', workflow: 'المسؤول المباشر',
      notes: reqNotes, imageUri: reqImage, approvalTrail: ['أرسل السائق الطلب'],
    };

    if (serviceTypeModal === 'وقود') {
      const qty = Number(reqQty);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      item.qty = qty; item.total = qty * currentUnitPrice(); item.station = selectedStation; item.fuelType = selectedFuel;
    } else if (serviceTypeModal === 'زيوت') {
      const qty = Number(reqQty); const odo = Number(currOdometer); const prev = lastOdometer(currentUser.id);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      if (!odo || odo < prev) { Alert.alert('تنبيه', `العداد الحالي يجب أن يكون أكبر أو يساوي ${prev}.`); return; }
      item.qty = qty; item.total = qty * currentUnitPrice(); item.oilType = selectedOil; item.unit = selectedUnit;
      item.prevOdo = prev; item.currOdo = odo; item.distance = odo - prev;
    } else if (serviceTypeModal === 'بطاريات') {
      item.itemName = selectedBattery; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'قطع غيار') {
      item.itemName = selectedPart; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'إطارات') {
      item.itemName = selectedTire; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'صيانة') {
      item.itemName = selectedMaintenance; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
      item.workshop = selectedWorkshop; item.engineer = selectedEngineer; item.faultType = faultType; item.requiredWork = requiredWork;
    } else if (serviceTypeModal === 'إرسالية صيانة') {
      if (!selectedWorkshop || !selectedEngineer || !faultType.trim() || !requiredWork.trim()) {
        Alert.alert('تنبيه', 'أكمل الورشة والمهندس ونوع العطل والعمل المطلوب.'); return;
      }
      item.qty = 1; item.total = 0; item.workshop = selectedWorkshop; item.engineer = selectedEngineer;
      item.faultType = faultType; item.requiredWork = requiredWork;
    } else if (serviceTypeModal === 'إرسالية خدمات بنشر') {
      if (!selectedClient || !serviceDescription.trim()) { Alert.alert('تنبيه', 'اختر العميل واكتب الخدمة المطلوبة.'); return; }
      item.qty = 1; item.total = 0; item.client = selectedClient; item.serviceDescription = serviceDescription;
      item.faultType = faultType; item.notes = reqNotes;
    }

    try {
      const { data, error } = await supabase.from('requests').insert({
        vehicle_id: item.vehicleId, applicant_id: currentUser.authId,
        driver_name: item.driver, service_type: item.type, request_date: item.date,
        quantity: item.qty, unit: item.unit || null, unit_price: item.qty ? item.total / item.qty : 0,
        total: item.total, station: item.station || null, odometer: item.currOdo ?? null,
        notes: makeStoredNotes(item), image_url: null, status: 'تحت المراجعة',
        direct_manager_status: 'تحت المراجعة', services_status: 'تحت المراجعة'
      }).select();
      if (error) throw error;
      if (data && data.length > 0) {
        item.id = String(data[0].id);
      }
      setRequests(prev => [item, ...prev]);
      setServiceTypeModal(null); resetRequestForm(); setUserTab('service');
      Alert.alert('تم إرسال الطلب', 'تم حفظ الطلب في قاعدة البيانات بنجاح.');
      loadSupabaseData();
    } catch (e: any) {
      Alert.alert('تعذر حفظ الطلب', e?.message || 'تحقق من اتصال الإنترنت وسياسات الجدول.');
    }
  };

  const advanceRequest = async (id: string) => {
    const requestId = Number(id);
    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      Alert.alert('خطأ', 'رقم الطلب غير صالح.');
      return;
    }
    try {
      setLoadingDb(true);
      const { error } = await supabase.rpc('approve_request', {
        p_id: requestId,
        p_note: 'تمت الموافقة عبر التطبيق',
      });
      if (error) throw error;
      await loadSupabaseData();
      Alert.alert(
        'تم التحديث',
        currentUser?.username === 'ميثاق2'
          ? 'تم اعتماد الطلب نهائيًا.'
          : 'تمت الموافقة على الطلب في المرحلة الأولى.'
      );
    } catch (e: any) {
      Alert.alert(
        'تعذر اعتماد الطلب',
        e?.message || 'تحقق من تعيين السيارة وصلاحيات مرحلة الاعتماد.'
      );
    } finally {
      setLoadingDb(false);
    }
  };

  const rejectRequest = async (id: string) => {
    Alert.prompt ? Alert.prompt('رفض الطلب', 'أدخل سبب الرفض:', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'رفض', style: 'destructive', onPress: async (reason) => {
          try {
            const { error } = await supabase.rpc('reject_request', { p_id: id, p_reason: reason || 'مرفوض بدون ذكر أسباب' });
            if (error) throw error;
            Alert.alert('تم الرفض', 'تم رفض الطلب وحفظ السبب.');
            loadSupabaseData();
          } catch (e: any) {
            Alert.alert('تعذر رفض الطلب', e?.message || 'تحقق من الصلاحيات.');
          }
        }
      }
    ]) : (
      async () => {
        try {
          const { error } = await supabase.rpc('reject_request', { p_id: id, p_reason: 'تم الرفض بواسطة المسؤول' });
          if (error) throw error;
          Alert.alert('تم الرفض', 'تم رفض الطلب بنجاح.');
          loadSupabaseData();
        } catch (e: any) {
          Alert.alert('خطأ', e?.message);
        }
      }
    )();
  };

  // دوال المعاينة والطباعة لنموذج (إصلاح سيارة) و (خدمات بنشر) (النقطة رقم 7)
  const handlePreviewPrintCarRepair = async (req: RequestItem) => {
    const vInfo = fleet.find(v => v.carNumber === req.vehicleId);
    const html = `
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Cairo', Tahoma, Arial, sans-serif; padding: 20px; color: #263238; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #C0272D; padding-bottom: 10px; margin-bottom: 15px; }
          .right-title { font-weight: bold; font-size: 16px; color: #C0272D; }
          .sub-title { font-size: 13px; font-weight: normal; margin-top: 4px; }
          .center-title { text-align: center; font-size: 20px; font-weight: bold; margin: 15px 0; text-decoration: underline; }
          .left-info { font-size: 13px; text-align: left; }
          .section { border: 1px solid #ccc; padding: 12px; margin-bottom: 12px; border-radius: 8px; background: #fafafa; }
          .section-title { font-weight: bold; margin-bottom: 6px; }
          .footer-sign { display: flex; justify-content: space-between; margin-top: 25px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="right-title">الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة</div>
            <div class="sub-title">الخدمات الإدارية</div>
          </div>
          <div class="left-info">
            <div>تاريخ الطلب: ${req.date}</div>
            <div>رقم العملية: ${req.id}</div>
          </div>
        </div>

        <div class="center-title">طلب إصلاح سيارة</div>

        <p>الإخوة / <b>${escapeHtml(req.client || 'ورشة الصيانة')}</b> المحترمون،،،</p>
        <p>بعد التحية،،</p>
        <p>رجاءً إجراء ما يلي على السيارة الموضحة بياناتها أدناه، وافادتنا بتقرير يوضح نوع العطل وسببه:</p>

        <div class="section">
          <div><b>رقم السيارة:</b> ${escapeHtml(req.vehicleId)} &nbsp;&nbsp;&nbsp; <b>اسم السيارة:</b> ${escapeHtml(vInfo?.name || '')}</div>
          <div style="margin-top: 5px;"><b>نوع السيارة:</b> ${escapeHtml(vInfo?.type || '')} &nbsp;&nbsp;&nbsp; <b>الموديل:</b> ${escapeHtml(vInfo?.model || '')}</div>
          <div style="margin-top: 5px;"><b>السائق:</b> ${escapeHtml(req.driver)}</div>
        </div>
        <div style="text-align: left; font-weight: bold; margin-bottom: 15px;">الخدمات الإدارية</div>

        <div class="section">
          <div class="section-title">الإخوة / الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة المحترمون،،</div>
          <p>بعد فحص السيارة الموضحة بياناتها أعلاه، اتضح ما يلي:</p>
          <ol>
            <li><b>الأعطال:</b> ${escapeHtml(req.faultType || req.notes || '')}</li>
            <li><b>سبب الأعطال إن وجد:</b> ${escapeHtml(req.requiredWork || '')}</li>
          </ol>
          <div style="text-align: left; margin-top: 20px;"><b>مسؤول الورشة</b></div>
        </div>

        <div class="section">
          <div><b>الإخوة / ${escapeHtml(req.client || 'العميل')} المحترمون،،</b></div>
          <p style="margin-top: 5px;">توافق على الإصلاح؟ (نعم / لا)</p>
          <div style="text-align: left; font-weight: bold;">الخدمات الإدارية</div>
        </div>

        <div class="section">
          <div><b>الإخوة / الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة المحترمون،،</b></div>
          <p style="margin-top: 5px;">تم إصلاح عطل السيارة المذكورة أعلاه، وتم تسليمها للأخ / <b>${escapeHtml(req.driver)}</b>.</p>
          <div class="footer-sign">
            <div>مسؤول الورشة</div>
            <div>المستلم</div>
          </div>
        </div>
      </body>
      </html>
    `;
    try {
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر الطباعة أو المعاينة');
    }
  };

  const handlePreviewPrintPunctureService = async (req: RequestItem) => {
    const vInfo = fleet.find(v => v.carNumber === req.vehicleId);
    const html = `
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Cairo', Tahoma, Arial, sans-serif; padding: 20px; color: #263238; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #C0272D; padding-bottom: 10px; margin-bottom: 15px; }
          .right-title { font-weight: bold; font-size: 16px; color: #C0272D; }
          .sub-title { font-size: 13px; font-weight: normal; margin-top: 4px; }
          .center-title { text-align: center; font-size: 20px; font-weight: bold; margin: 15px 0; text-decoration: underline; }
          .left-info { font-size: 13px; text-align: left; }
          .section { border: 1px solid #ccc; padding: 12px; margin-bottom: 15px; border-radius: 8px; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="right-title">الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة</div>
            <div class="sub-title">الخدمات الإدارية</div>
          </div>
          <div class="left-info">
            <div>تاريخ الطلب: ${req.date}</div>
            <div>رقم العملية: ${req.id}</div>
          </div>
        </div>

        <div class="center-title">طلب خدمات بنشر</div>

        <p>الإخوة / <b>${escapeHtml(req.client || 'مزود الخدمة')}</b> المحترمون،،،</p>
        <p>بعد التحية،،</p>
        <p>يرجى عمل الخدمات أدناه للسيارة الموضحة بياناتها أعلاه:</p>

        <div class="section">
          <div><b>رقم السيارة:</b> ${escapeHtml(req.vehicleId)} &nbsp;&nbsp;&nbsp; <b>اسم السيارة:</b> ${escapeHtml(vInfo?.name || '')}</div>
          <div style="margin-top: 5px;"><b>السائق:</b> ${escapeHtml(req.driver)}</div>
          <div style="margin-top: 10px;"><b>الخدمة المطلوبة:</b> ${escapeHtml(req.serviceDescription || req.notes || '')}</div>
        </div>

        <div style="text-align: left; font-weight: bold; margin-top: 40px;">
          الخدمات الإدارية
        </div>
      </body>
      </html>
    `;
    try {
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر الطباعة أو المعاينة');
    }
  };

  const saveCodingItem = () => {
    if (!codingModal || !newItem.trim()) return;
    const setter = codingSetters[codingModal];
    if (!setter) return;
    setter(prev => [...prev, newItem.trim()]);
    setNewItem('');
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
      [r.id, r.vehicleId, r.driver, r.type, r.date, r.qty, r.total, r.status, r.workflow || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const uri = `${FileSystem.cacheDirectory}${filename}-${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(uri, header + body, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'تصدير التقرير' });
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
          <View style={styles.menuIcon}><Text style={styles.menuIconText}>{['⛽','🛢️','🔋','🔧','🛞','🏪','🛠️','🏭','👥','👨‍🔧','🚙','🧭','📍'][i] || '🧩'}</Text></View>
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
    const requestTabs: Array<[string,string]> = [['وقود','وقود'],['زيوت','زيوت'],['قطع غيار','قطع غيار'],['صيانة','صيانة'],['إطارات','إطارات'],['بطاريات','بطاريات'],['إرسالية صيانة','إرسالية صيانة'],['إرسالية خدمات بنشر','إرسالية خدمات بنشر']];
    
    const rows = requests.filter(r => {
      if (r.type !== adminRequestTab) return false;
      const isFinalApprover = currentUser?.username === 'ميثاق2';
      if (isFinalApprover) {
        return (
          r.directManagerStatus === 'موافق' &&
          r.servicesStatus !== 'موافق' &&
          r.servicesStatus !== 'مرفوض' &&
          r.status !== 'مرفوض' &&
          r.status !== 'تمت الموافقة'
        );
      }
      const isPendingDirectApproval =
        !r.directManagerStatus ||
        r.directManagerStatus === 'تحت المراجعة' ||
        r.directManagerStatus === 'بانتظار المراجعة' ||
        r.directManagerStatus === 'قيد المراجعة';
      return (
        isPendingDirectApproval &&
        r.status !== 'مرفوض' &&
        r.status !== 'تمت الموافقة'
      );
    });

    return (
      <View>
        <Text style={styles.sectionTitle}>طلبات الخدمات والاعتمادات</Text>
        <Text style={styles.helper}>إدارة طلبات الأسطول الواردة ومتابعة حالة اعتمادها.</Text>
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
            <Text style={styles.cardText}>القيمة: {money(r.total)}</Text>
            {r.station ? <Text style={styles.cardText}>المحطة: {r.station}</Text> : null}
            {r.notes ? <Text style={styles.cardText}>الملاحظات: {r.notes}</Text> : null}
            {r.faultType ? <Text style={styles.cardText}>العطل: {r.faultType}</Text> : null}
            {r.requiredWork ? <Text style={styles.cardText}>العمل المطلوب: {r.requiredWork}</Text> : null}
            {r.serviceDescription ? <Text style={styles.cardText}>وصف الخدمة: {r.serviceDescription}</Text> : null}
            <Text style={styles.workflowTitle}>المرحلة: {r.workflow || 'المسؤول المباشر'}</Text>
            {r.imageUri ? <View><Image source={{uri:r.imageUri}} style={styles.requestImage} /></View> : null}

            {/* أزرار المعاينة والطباعة المباشرة عند الموافقة النهائية */}
            {r.type === 'إرسالية صيانة' && r.status === 'تمت الموافقة' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB'}]} onPress={() => handlePreviewPrintCarRepair(r)}>
                  <Text style={styles.btnText}>معاينة وطباعة</Text>
                </TouchableOpacity>
              </View>
            )}
            {r.type === 'إرسالية خدمات بنشر' && r.status === 'تمت الموافقة' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB'}]} onPress={() => handlePreviewPrintPunctureService(r)}>
                  <Text style={styles.btnText}>معاينة وطباعة</Text>
                </TouchableOpacity>
              </View>
            )}

            {r.status !== 'تمت الموافقة' && r.status !== 'مرفوض' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.success}]} onPress={() => advanceRequest(r.id)}><Text style={styles.btnText}>اعتماد / قبول</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.danger}]} onPress={() => rejectRequest(r.id)}><Text style={styles.btnText}>رفض</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderRequestManagersAdmin = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>مسؤولي الطلبات</Text>
        <Text style={styles.helper}>إدارة المسؤولين، صلاحياتهم، ومسارات مسار الاعتمادات.</Text>
        <View style={{flexDirection: 'row-reverse', gap: 6, marginBottom: 15}}>
          {['قائمة المسؤولين', 'الصلاحيات', 'مسارات الطلبات'].map((tab, idx) => {
            const keys = ['list', 'permissions', 'routes'];
            const active = requestManagersTab === keys[idx];
            return (
              <TouchableOpacity key={keys[idx]} onPress={() => setRequestManagersTab(keys[idx])}
                style={[styles.choice, active && styles.choiceActive, {flex: 1, alignItems: 'center'}]}>
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {requestManagersTab === 'list' && (
          <View>
            <Text style={[styles.sectionTitle, {fontSize: 16}]}>قائمة المسؤولين الحاليين</Text>
            {managerProfiles.filter(m => ['manager', 'direct_manager', 'admin', 'services_manager'].includes(m.role)).map(m => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.cardTitle}>{m.full_name || m.username}</Text>
                <Text style={styles.cardText}>الدور / الصلاحية: {m.role}</Text>
                <Text style={styles.cardText}>الهاتف: {m.phone || 'غير متوفر'}</Text>
                <Text style={styles.cardText}>الحالة: {m.is_active !== false ? 'مفعل' : 'موقف'}</Text>
              </View>
            ))}
          </View>
        )}
        {requestManagersTab === 'permissions' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تخصيص صلاحيات المسؤولين</Text>
            <Text style={styles.cardText}>يمكنك هنا تحديد أنواع الطلبات التي تصل لكل مسؤول بدقة وتفعيلها أو إيقافها.</Text>
            {managerProfiles.filter(m => ['manager', 'direct_manager', 'admin'].includes(m.role)).map(m => (
              <View key={m.id} style={[styles.inlineRow, {justifyContent: 'space-between'}]}>
                <Text style={{textAlign: 'right', fontWeight: '700'}}>{m.full_name || m.username}</Text>
                <Text style={{color: COLORS.success, fontWeight: '700'}}>صلاحية كاملة للطلبات</Text>
              </View>
            ))}
          </View>
        )}
        {requestManagersTab === 'routes' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة مسارات الطلبات</Text>
            <Text style={styles.helper}>تحديد مسارات سير العمل والاعتمادات (مثل: السائق، المسؤول، الخدمات).</Text>
            <TextInput style={styles.input} placeholder="اسم المسار الجديد (مثل: الإدارة العليا)" value={newRouteName} onChangeText={setNewRouteName} textAlign="right" />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              if (newRouteName.trim()) {
                setWorkflowRoutes(prev => [...prev, newRouteName.trim()]);
                setNewRouteName('');
                Alert.alert('تم', 'تمت إضافة المسار بنجاح');
              }
            }}>
              <Text style={styles.btnText}>إضافة مسار جديد</Text>
            </TouchableOpacity>
            <View style={{marginTop: 15}}>
              {workflowRoutes.map((route, i) => (
                <View key={i} style={styles.inlineRow}>
                  <Text style={{flex: 1, textAlign: 'right', fontWeight: '700'}}>{route}</Text>
                  <TouchableOpacity onPress={() => setWorkflowRoutes(prev => prev.filter((_, index) => index !== i))}>
                    <Text style={styles.deleteText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
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
        id: '', carNumber: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
        payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة'
      });
      setVehicleModalVisible(true);
    };

    const openEditVehicle = (v: Vehicle) => {
      setVehicleEditId(v.id);
      setVehicleForm({ ...v, carNumber: v.carNumber, ownership: v.ownership || 'شركة' });
      setVehicleModalVisible(true);
    };

    const saveVehicle = async () => {
      if (!vehicleForm.carNumber.trim() || !vehicleForm.name.trim() || !vehicleForm.type.trim()) {
        Alert.alert('تنبيه', 'رقم السيارة واسم السيارة والنوع حقول مطلوبة.'); return;
      }
      const row = {
        car_number: vehicleForm.carNumber.trim(), car_name: vehicleForm.name.trim(), brand: vehicleForm.type || null,
        manufacturing_year: Number(vehicleForm.model) || null, model: vehicleForm.model || null,
        load_capacity: vehicleForm.payload || null, engine_number: vehicleForm.engineNo || null,
        chassis_number: vehicleForm.chassisNo || null
      };
      try {
        const result = vehicleEditId
          ? await supabase.from('vehicles').update(row).eq('id', vehicleEditId)
          : await supabase.from('vehicles').insert(row);
        if (result.error) throw result.error;
        setVehicleModalVisible(false);
        Alert.alert('تم الحفظ', 'تم حفظ بيانات السيارة في قاعدة البيانات بنجاح.');
        loadSupabaseData();
      } catch (e: any) { Alert.alert('تعذر حفظ السيارة', e?.message || 'تحقق من صلاحيات جدول vehicles.'); }
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
        <TouchableOpacity style={styles.importBtn} onPress={loadSupabaseData}>
          <Text style={styles.btnText}>🔄 مزامنة السيارات من السحابة</Text>
        </TouchableOpacity>
        {filtered.map(v => (
          <View key={v.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>🚗 {v.carNumber}</Text>
              <Text style={styles.badge}>{v.status}</Text>
            </View>
            <Text style={styles.cardTitle}>{v.name}</Text>
            <Text style={styles.cardText}>السائق: {v.driver}</Text>
            <Text style={styles.cardText}>الموديل: {v.model} | السعة: {v.payload}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => openEditVehicle(v)}>
                <Text style={styles.btnText}>تعديل</Text>
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
                  ['carNumber','رقم السيارة (car_number)'], ['name','اسم السيارة'], ['type','فئة النقل'],
                  ['model','الموديل'], ['payload','الحمولة / السعة'], ['engineNo','رقم المحرك'], ['chassisNo','رقم الشاسيه']
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
                <TouchableOpacity style={styles.primaryBtn} onPress={saveVehicle}><Text style={styles.btnText}>حفظ السيارة</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVehicleModalVisible(false)}><Text style={styles.btnText}>إلغاء</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

  // تعديل واجهة ربط السائقين بالسيارات (النقطة رقم 5)
  const renderAssignments = () => {
    const filteredVehicles = fleet.filter(v => 
      !assignmentSearchCar || v.carNumber.includes(assignmentSearchCar) || v.name.includes(assignmentSearchCar)
    );
    const filteredDrivers = driverNames.filter(d => 
      !assignmentSearchDriver || d.includes(assignmentSearchDriver)
    );

    return (
      <View>
        <Text style={styles.sectionTitle}>ربط السائقين بالسيارات</Text>
        <Text style={styles.helper}>حدد السيارة (بالقائمة أو البحث)، السائق (بالقائمة أو البحث)، وتواريخ الربط.</Text>
        
        {/* بند اختر السيارة وبحث برقم السيارة */}
        <Text style={styles.label}>اختر السيارة أو ابحث برقمها</Text>
        <View style={{flexDirection: 'row-reverse', gap: 8, marginBottom: 10}}>
          <TouchableOpacity style={[styles.dropdownInput, {flex: 1, marginBottom: 0}]} onPress={() => setVehicleDropdownVisible(true)}>
            <Text style={{textAlign:'right', color: assignmentForm.vehicleId ? COLORS.text : COLORS.muted}}>
              {assignmentForm.vehicleId ? `${assignmentForm.vehicleId} — ${assignmentVehicle?.name || ''}` : 'اختر من القائمة'}
            </Text>
          </TouchableOpacity>
          <TextInput 
            style={[styles.input, {flex: 1, marginBottom: 0}]} 
            placeholder="بحث برقم السيارة" 
            value={assignmentSearchCar}
            onChangeText={setAssignmentSearchCar}
            textAlign="right"
          />
        </View>

        {/* بند السائق وبحث برقم أو اسم السائق */}
        <Text style={styles.label}>السائق</Text>
        <View style={{flexDirection: 'row-reverse', gap: 8, marginBottom: 10}}>
          <TouchableOpacity style={[styles.dropdownInput, {flex: 1, marginBottom: 0}]} onPress={() => setDriverDropdownVisible(true)}>
            <Text style={{textAlign: 'right', color: assignmentForm.driver ? COLORS.text : COLORS.muted}}>
              {assignmentForm.driver || 'اختر السائق'}
            </Text>
          </TouchableOpacity>
          <TextInput 
            style={[styles.input, {flex: 1, marginBottom: 0}]} 
            placeholder="بحث بالسائق" 
            value={assignmentSearchDriver}
            onChangeText={setAssignmentSearchDriver}
            textAlign="right"
          />
        </View>

        {/* تاريخ بداية الربط */}
        <Text style={styles.label}>تاريخ بداية الربط</Text>
        <TextInput 
          style={styles.input} 
          value={assignmentStartDate} 
          onChangeText={setAssignmentStartDate} 
          placeholder="YYYY-MM-DD" 
          textAlign="right" 
        />

        {/* تاريخ نهاية الربط (غير إلزامي) */}
        <Text style={styles.label}>تاريخ نهاية الربط (اختياري / مفتوح)</Text>
        <TextInput 
          style={styles.input} 
          value={assignmentEndDate} 
          onChangeText={setAssignmentEndDate} 
          placeholder="يترك فارغاً ليبقى الربط مفتوحاً" 
          textAlign="right" 
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
          if (!assignmentForm.vehicleId || !assignmentForm.driver) { Alert.alert('تنبيه', 'أكمل بيانات السيارة والسائق للربط.'); return; }
          const newAsg: Assignment = {
            id: `ASG-${Date.now()}`,
            driver: assignmentForm.driver,
            driverId: assignmentForm.driver,
            vehicleId: assignmentForm.vehicleId,
            startDate: assignmentStartDate,
            endDate: assignmentEndDate || 'مفتوح',
            notes: 'تم الربط بنجاح'
          };
          setAssignments(prev => [newAsg, ...prev]);
          Alert.alert('تم', 'تم حفظ عملية الربط بنجاح.');
        }}>
          <Text style={styles.btnText}>حفظ عملية الربط</Text>
        </TouchableOpacity>

        {/* جدول عمليات الربط السابقة */}
        <Text style={[styles.sectionTitle, {marginTop: 25, fontSize: 16}]}>سجل عمليات الربط السابقة</Text>
        {assignments.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد عمليات ربط مسجلة بعد.</Text></View>
        ) : (
          <View style={{backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginTop: 8}}>
            <View style={{flexDirection: 'row-reverse', backgroundColor: '#F1F5F9', padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border}}>
              <Text style={{flex: 2, fontWeight: '800', textAlign: 'right'}}>السيارة / السائق</Text>
              <Text style={{flex: 1.5, fontWeight: '800', textAlign: 'right'}}>تاريخ البداية</Text>
              <Text style={{flex: 1.5, fontWeight: '800', textAlign: 'right'}}>تاريخ النهاية</Text>
            </View>
            {assignments.map((asg) => (
              <View key={asg.id} style={{flexDirection: 'row-reverse', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', alignItems: 'center'}}>
                <Text style={{flex: 2, textAlign: 'right', fontSize: 13}}>{asg.vehicleId} - {asg.driver}</Text>
                <Text style={{flex: 1.5, textAlign: 'right', fontSize: 13}}>{asg.startDate}</Text>
                <Text style={{flex: 1.5, textAlign: 'right', fontSize: 13, color: asg.endDate === 'مفتوح' ? COLORS.success : COLORS.text}}>{asg.endDate}</Text>
              </View>
            ))}
          </View>
        )}

        {/* مودال اختيار السيارة */}
        <Modal visible={vehicleDropdownVisible} transparent animationType="fade" onRequestClose={() => setVehicleDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>اختيار السيارة</Text>
              <ScrollView style={{maxHeight:450}}>
                {filteredVehicles.map(v => (
                  <TouchableOpacity key={v.id} style={styles.driverOption} onPress={() => { setAssignmentForm(p => ({ ...p, vehicleId: v.carNumber })); setVehicleDropdownVisible(false); }}>
                    <Text style={styles.driverOptionText}>{v.carNumber} — {v.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVehicleDropdownVisible(false)}><Text style={styles.btnText}>إغلاق</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* مودال اختيار السائق */}
        <Modal visible={driverDropdownVisible} transparent animationType="fade" onRequestClose={() => setDriverDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>اختيار السائق</Text>
              <ScrollView style={{ maxHeight: 450 }}>
                {filteredDrivers.map(name => (
                  <TouchableOpacity key={name} style={styles.driverOption}
                    onPress={() => { setAssignmentForm(p => ({ ...p, driver: name })); setDriverDropdownVisible(false); }}>
                    <Text style={styles.driverOptionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDriverDropdownVisible(false)}>
                <Text style={styles.btnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderPermissions = () => (
    <View>
      <Text style={styles.sectionTitle}>الصلاحيات</Text>
      {fleet.map(v => {
        const p = getPermission(v.carNumber);
        return (
          <View key={v.id} style={styles.card}>
            <Text style={styles.cardTitle}>{v.carNumber} - {v.driver}</Text>
            <View style={styles.switchRow}>
              <Switch value={!!p.requestService} onValueChange={value => setVehiclePermission(v.carNumber,'requestService',value)} />
              <Text style={styles.switchLabel}>طلبات الخدمات</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderMyRequestsAndReports = () => {
    const myRows = requests.filter(r => r.vehicleId === currentUser?.id || r.applicantId === currentUser?.authId);
    return (
      <View>
        <View style={{flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border}}>
          <TouchableOpacity onPress={() => setSubView('report')} style={[{flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: subView === 'report' ? COLORS.primary : 'transparent'}]}>
            <Text style={{fontWeight: '900', color: subView === 'report' ? COLORS.primary : COLORS.muted}}>سجل الطلبات</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSubView('create')} style={[{flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: subView === 'create' ? COLORS.primary : 'transparent'}]}>
            <Text style={{fontWeight: '900', color: subView === 'create' ? COLORS.primary : COLORS.muted}}>طلب جديد</Text>
          </TouchableOpacity>
        </View>

        {subView === 'create' ? (
          <View>
            <Text style={styles.sectionTitle}>الخدمات والطلبات</Text>
            {['وقود', 'زيوت', 'بطاريات', 'قطع غيار', 'صيانة', 'إطارات', 'إرسالية صيانة وخدمات'].map((type, index) => (
              <TouchableOpacity key={type} style={styles.serviceCard} onPress={() => openServiceRequest(type)}>
                <View style={styles.serviceIcon}><Text style={{fontSize:25}}>{['⛽','🛢️','🔋','🔧','🛠️','🛞','🧰'][index]}</Text></View>
                <View style={{flex:1}}><Text style={styles.serviceTitle}>{type === 'إرسالية صيانة وخدمات' ? 'طلب إرسالية صيانة وخدمات' : `طلب ${type}`}</Text><Text style={styles.serviceSub}>إنشاء طلب جديد وإرفاق المستندات</Text></View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>سجل وتقرير الطلبات</Text>
            {myRows.length === 0 ? (
              <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد طلبات مسجلة خاصة بك حالياً.</Text></View>
            ) : null}
            {myRows.map(r => {
              const isApproved = r.status === 'تمت الموافقة';
              const isRejected = r.status === 'مرفوض';
              return (
                <View key={r.id} style={[styles.card, {borderRightWidth: 5, borderRightColor: isApproved ? COLORS.success : isRejected ? COLORS.danger : COLORS.warning}]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardId}>طلب #{r.id}</Text>
                    <Text style={[styles.badge, {backgroundColor: isApproved ? '#E8F5E9' : isRejected ? '#FFEBEE' : '#FFF4E5', color: isApproved ? COLORS.success : isRejected ? COLORS.danger : '#9A5B00'}]}>{r.status}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{r.type}</Text>
                  <Text style={styles.cardText}>التاريخ: {r.date} | الكمية: {r.qty}</Text>
                  <Text style={styles.cardText}>التكلفة الإجمالية: {money(r.total)}</Text>
                  
                  {/* أزرار المعاينة والطباعة للمستخدم في حال الموافقة */}
                  {r.type === 'إرسالية صيانة' && isApproved && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB', marginTop: 8}]} onPress={() => handlePreviewPrintCarRepair(r)}>
                      <Text style={styles.btnText}>معاينة وطباعة النموذج</Text>
                    </TouchableOpacity>
                  )}
                  {r.type === 'إرسالية خدمات بنشر' && isApproved && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB', marginTop: 8}]} onPress={() => handlePreviewPrintPunctureService(r)}>
                      <Text style={styles.btnText}>معاينة وطباعة النموذج</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8}}>
                    <Text style={{textAlign: 'right', fontWeight: '800', color: COLORS.primary, fontSize: 13}}>مسار الاعتمادات الحالي:</Text>
                    <Text style={{textAlign: 'right', color: COLORS.text, fontSize: 12, marginTop: 2}}>المدير المباشر: {r.directManagerStatus || 'تحت المراجعة'}</Text>
                    <Text style={{textAlign: 'right', color: COLORS.text, fontSize: 12}}>الخدمات: {r.servicesStatus || 'تحت المراجعة'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // تقارير المستخدم المفصلة والإجمالية (النقطة رقم 6)
  const renderUserReportsSection = () => {
    const myRows = requests.filter(r => r.vehicleId === currentUser?.id || r.applicantId === currentUser?.authId);
    const reportCategories = [
      { key: 'وقود', label: 'تقرير المحروقات', icon: '⛽' },
      { key: 'زيوت', label: 'تقرير الزيوت', icon: '🛢️' },
      { key: 'قطع غيار', label: 'تقرير قطع الغيار', icon: '🔧' },
      { key: 'إطارات', label: 'تقارير الإطارات', icon: '🛞' },
      { key: 'صيانة', label: 'تقارير الصيانة', icon: '🛠️' },
      { key: 'بطاريات', label: 'تقارير البطاريات', icon: '🔋' },
      { key: 'رحلات', label: 'تقارير الرحلات', icon: '🧭' },
    ];

    const [selectedRepCat, setSelectedRepCat] = useState('وقود');
    const [repMode, setRepMode] = useState<'إجمالي' | 'تفصيلي'>('إجمالي');

    const filteredRows = myRows.filter(r => {
      if (selectedRepCat === 'رحلات') return r.type.includes('رحلة') || r.type.includes('مهمة');
      return r.type === selectedRepCat;
    });

    const totalCost = filteredRows.reduce((s, r) => s + Number(r.total || 0), 0);
    const totalQty = filteredRows.reduce((s, r) => s + Number(r.qty || 0), 0);

    return (
      <View>
        <Text style={styles.sectionTitle}>تقارير السيارة والأداء</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow} style={{marginBottom: 12}}>
          {reportCategories.map(cat => (
            <TouchableOpacity key={cat.key} onPress={() => setSelectedRepCat(cat.key)}
              style={[styles.choice, selectedRepCat === cat.key && styles.choiceActive]}>
              <Text style={[styles.choiceText, selectedRepCat === cat.key && styles.choiceTextActive]}>{cat.icon} {cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{flexDirection: 'row-reverse', gap: 10, marginBottom: 12}}>
          <TouchableOpacity onPress={() => setRepMode('إجمالي')} style={[styles.choice, repMode === 'إجمالي' && styles.choiceActive, {flex: 1, alignItems: 'center'}]}>
            <Text style={[styles.choiceText, repMode === 'إجمالي' && styles.choiceTextActive]}>إجمالي</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRepMode('تفصيلي')} style={[styles.choice, repMode === 'تفصيلي' && styles.choiceActive, {flex: 1, alignItems: 'center'}]}>
            <Text style={[styles.choiceText, repMode === 'تفصيلي' && styles.choiceTextActive]}>تفصيلي</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{selectedRepCat} - ({repMode})</Text>
          <Text style={styles.summaryValue}>{money(totalCost)}</Text>
          <Text style={styles.summarySub}>إجمالي الكميات: {totalQty} | عدد العمليات: {filteredRows.length}</Text>
        </View>

        {filteredRows.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد بيانات مطابقة لهذا التقرير.</Text></View>
        ) : null}

        {repMode === 'إجمالي' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ملخص الفترة الحالية</Text>
            <Text style={styles.cardText}>النوع: {selectedRepCat}</Text>
            <Text style={styles.cardText}>إجمالي التكلفة: {money(totalCost)}</Text>
            <Text style={styles.cardText}>إجمالي الكمية المسجلة: {totalQty}</Text>
          </View>
        ) : (
          filteredRows.map(r => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}><Text style={styles.cardId}>رقم العملية: {r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
              <Text style={styles.cardText}>التاريخ: {r.date}</Text>
              <Text style={styles.cardText}>الكمية أو المخصص: {r.qty}</Text>
              <Text style={styles.cardText}>الإجمالي/القيمة: {money(r.total)}</Text>
              {r.station ? <Text style={styles.cardText}>المحطة: {r.station}</Text> : null}
              {r.itemName ? <Text style={styles.cardText}>الصنف: {r.itemName}</Text> : null}
            </View>
          ))
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.success }]} onPress={() => exportExcel(filteredRows, `${selectedRepCat}-report`)}>
            <Text style={styles.btnText}>تصدير Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.primary }]} onPress={() => exportPdf(filteredRows, `تقرير ${selectedRepCat}`)}>
            <Text style={styles.btnText}>تصدير PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReports = (isAdmin = false) => {
    let rows = isAdmin ? requests : requests.filter(r => r.vehicleId === currentUser?.id || r.applicantId === currentUser?.authId);
    if (reportType !== 'الكل') rows = rows.filter(r => r.type === reportType);
    const total = rows.reduce((s,r) => s + Number(r.total || 0), 0);
    return (
      <View>
        <Text style={styles.sectionTitle}>{isAdmin ? 'التقارير الشاملة' : 'تقارير طلباتي'}</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي المصاريف والطلبات</Text>
          <Text style={styles.summaryValue}>{money(total)}</Text>
          <Text style={styles.summarySub}>{rows.length} عملية</Text>
        </View>
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
            <Text style={styles.cardTitle}>{r.type}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date} | الكمية: {r.qty}</Text>
            <Text style={styles.cardText}>التكلفة: {money(r.total)}</Text>
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

  // واجهة الإعدادات في حساب المستخدم متضمنة أيقونة تسجيل الخروج (النقطة رقم 2)
  const renderUserSettings = () => {
    return (
      <View style={{backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden'}}>
        <View style={{backgroundColor: COLORS.primary, padding: 25, alignItems: 'center'}}>
          <Image source={{uri: currentUser?.profile?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}} style={{width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff', marginBottom: 10}} />
          <Text style={{color: '#fff', fontSize: 18, fontWeight: '900'}}>{currentUser?.name || currentUser?.username || 'ميثاق عبده علي مقبل'}</Text>
        </View>
        {[
          {title: 'الوضع الداكن', icon: '🌙', isSwitch: true},
          {title: 'بيانات الموظف', icon: '👤', action: () => Alert.alert('بيانات الموظف', `الاسم: ${currentUser?.name}\nالمستخدم: ${currentUser?.username}\nالدور: ${currentUser?.role}`)},
          {title: 'تغيير كلمة السر', icon: '🛡️', action: () => Alert.alert('تغيير كلمة السر', 'قريباً تفعيل ميزة تغيير كلمة المرور.')},
          {title: 'قد يهمك', icon: '🛍️', action: () => Alert.alert('قد يهمك', 'لا توجد إشعارات أو عروض جديدة حالياً.')},
          {title: 'تحديث التطبيق', icon: '🔄', action: () => Alert.alert('التحديث', `أنت تستخدم أحدث إصدار (${APP_VERSION})`)},
          {title: 'مشاركة التطبيق', icon: '📤', action: () => Alert.alert('مشاركة', 'تم نسخ رابط التطبيق للحافظة.')},
          {title: 'حول التطبيق', icon: 'ℹ️', action: () => Alert.alert('حول التطبيق', 'نظام إدارة الأسطول المتقدم - الإصدار ' + APP_VERSION)},
          {title: 'تسجيل الخروج', icon: '🚪', danger: true, action: handleLogout},
        ].map((item, idx) => (
          <TouchableOpacity key={idx} onPress={item.action} style={{flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'}}>
            <Text style={{fontSize: 20, marginLeft: 15}}>{item.icon}</Text>
            <Text style={{flex: 1, textAlign: 'right', fontSize: 16, fontWeight: '700', color: item.danger ? COLORS.danger : COLORS.text}}>{item.title}</Text>
            {item.isSwitch ? (
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{false: '#767577', true: COLORS.primary}} />
            ) : (
              <Text style={{color: COLORS.muted, fontSize: 18}}>‹</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // مودال تقديم طلب الخدمة (مع التعديلات الخاصة بإرسالية صيانة وخدمات بنشر - النقطة رقم 7)
  const renderRequestModal = () => {
    if (!serviceTypeModal && !maintenanceServiceSubModal) return null;

    if (maintenanceServiceSubModal) {
      return (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMaintenanceServiceSubModal(null)}>
          <SafeAreaView style={styles.requestModalScreen}>
            <View style={styles.requestModalHeader}>
              <Text style={styles.modalTitle}>طلب إرسالية صيانة وخدمات</Text>
              <TouchableOpacity onPress={() => setMaintenanceServiceSubModal(null)}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.requestFormScroll} contentContainerStyle={styles.requestFormContent}>
              <Text style={styles.sectionTitle}>اختر نوع الإرسالية:</Text>
              <TouchableOpacity style={styles.serviceCard} onPress={() => { setMaintenanceServiceSubModal(null); setServiceTypeModal('إرسالية صيانة'); }}>
                <View style={styles.serviceIcon}><Text style={{fontSize:22}}>🛠️</Text></View>
                <View style={{flex:1}}><Text style={styles.serviceTitle}>إرسالية صيانة</Text><Text style={styles.serviceSub}>طلب إصلاح سيارة وعطل فني</Text></View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceCard} onPress={() => { setMaintenanceServiceSubModal(null); setServiceTypeModal('إرسالية خدمات بنشر'); }}>
                <View style={styles.serviceIcon}><Text style={{fontSize:22}}>🛞</Text></View>
                <View style={{flex:1}}><Text style={styles.serviceTitle}>إرسالية خدمات بنشر</Text><Text style={styles.serviceSub}>طلب خدمات إطارات وبنشر</Text></View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      );
    }

    const price = currentUnitPrice();
    const qty = Number(reqQty) || 0;
    const prev = lastOdometer(currentUser?.id || '');

    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setServiceTypeModal(null); resetRequestForm(); }}>
        <SafeAreaView style={styles.requestModalScreen}>
          <View style={styles.requestModalHeader}><Text style={styles.modalTitle}>طلب {serviceTypeModal}</Text><TouchableOpacity onPress={() => { setServiceTypeModal(null); resetRequestForm(); }}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity></View>
          <ScrollView style={styles.requestFormScroll} contentContainerStyle={styles.requestFormContent} keyboardShouldPersistTaps="handled">
            <View style={styles.infoPill}><Text style={styles.infoPillText}>السيارة: {currentUser?.id}</Text><Text style={styles.infoPillText}>التاريخ: {TODAY()}</Text></View>
            
            {serviceTypeModal === 'وقود' && <>{renderSelect('المحطة', selectedStation, stations, setSelectedStation)}{renderSelect('نوع الوقود', selectedFuel, fuelTypes, setSelectedFuel)}</>}
            {serviceTypeModal === 'زيوت' && <>{renderSelect('نوع الزيت', selectedOil, oils, setSelectedOil)}<Text style={styles.label}>العداد السابق</Text><TextInput style={styles.readOnlyInput} value={String(prev)} editable={false} textAlign="right" /><Text style={styles.label}>العداد الحالي</Text><TextInput style={styles.input} keyboardType="numeric" value={currOdometer} onChangeText={setCurrOdometer} textAlign="right" /></>}
            {serviceTypeModal === 'بطاريات' && renderSelect('نوع البطارية', selectedBattery, batteries, setSelectedBattery)}
            {serviceTypeModal === 'قطع غيار' && renderSelect('قطعة الغيار', selectedPart, parts, setSelectedPart)}
            {serviceTypeModal === 'إطارات' && renderSelect('نوع الإطار', selectedTire, tires, setSelectedTire)}
            {serviceTypeModal === 'صيانة' && renderSelect('نوع الصيانة', selectedMaintenance, maintenanceItems, setSelectedMaintenance)}
            
            {/* نموذج إرسالية صيانة */}
            {serviceTypeModal === 'إرسالية صيانة' && (
              <>
                {renderSelect('الورشة', selectedWorkshop, workshops, setSelectedWorkshop)}
                {renderSelect('المهندس', selectedEngineer, engineers, setSelectedEngineer)}
                <Text style={styles.label}>سبب المشكلة / العطل</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={faultType} onChangeText={setFaultType} placeholder="اكتب وصف العطل هنا..." multiline textAlign="right" />
                <Text style={styles.label}>الإجراء المطلوب</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={requiredWork} onChangeText={setRequiredWork} placeholder="اكتب الإجراء المطلوب هنا..." multiline textAlign="right" />
              </>
            )}

            {/* نموذج إرسالية خدمات بنشر */}
            {serviceTypeModal === 'إرسالية خدمات بنشر' && (
              <>
                <Text style={styles.label}>التاريخ</Text>
                <TextInput style={styles.readOnlyInput} value={TODAY()} editable={false} textAlign="right" />
                {renderSelect('العميل', selectedClient, clients, setSelectedClient)}
                <Text style={styles.label}>الخدمة المطلوبة / نوع العطل</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={serviceDescription} onChangeText={setServiceDescription} placeholder="اكتب تفاصيل الخدمة المطلوبة..." multiline textAlign="right" />
                <Text style={styles.label}>ملاحظات</Text>
                <TextInput style={[styles.input,{minHeight:55}]} value={reqNotes} onChangeText={setReqNotes} placeholder="ملاحظات إضافية..." multiline textAlign="right" />
              </>
            )}

            {serviceTypeModal !== 'إرسالية صيانة' && serviceTypeModal !== 'إرسالية خدمات بنشر' && (
              <>
                <Text style={styles.label}>الكمية</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={reqQty} onChangeText={setReqQty} placeholder="أدخل الكمية" textAlign="right" />
                {price > 0 && <Text style={styles.totalText}>الإجمالي التقديري: {money(qty * price)}</Text>}
                <Text style={styles.label}>الملاحظات</Text>
                <TextInput style={[styles.input,{minHeight:75}]} value={reqNotes} onChangeText={setReqNotes} multiline textAlign="right" />
              </>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={openImagePicker}><Text style={styles.btnText}>📷 إرفاق صورة</Text></TouchableOpacity>
            {reqImage ? <View><Image source={{ uri: reqImage }} style={styles.previewImage} /></View> : null}
          </ScrollView>
          <View style={styles.requestFooter}><TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.primary}]} onPress={submitRequest}><Text style={styles.btnText}>إرسال الطلب</Text></TouchableOpacity></View>
        </SafeAreaView>
      </Modal>
    );
  };

  // واجهة تسجيل الدخول المعدلة (النقطة رقم 1: حذف عبارة نظام إدارة السيارات، جاهزة، عدد السيارات، ومزامنة تحميل السيارات، وظهور اسم المستخدم وكلمة المرور فقط)
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>تسجيل الدخول</Text>
          <TextInput style={styles.input} placeholder="اسم المستخدم" placeholderTextColor="#94A3B8"
            value={username} onChangeText={setUsername} textAlign="right" />
          <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#94A3B8"
            secureTextEntry value={password} onChangeText={setPassword} textAlign="right" />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}><Text style={styles.btnText}>دخول</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // لوحة تحكم المسؤول / المدير (مع نقل زر تسجيل الخروج لقسم الإعدادات - النقطة رقم 2)
  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    const adminNav = [
      ['requests', '📋', 'الطلبات'],
      ['coding', '🧩', 'التكويدات'],
      ['pricing', '💰', 'الأسعار'],
      ['fleet', '🚗', 'السيارات'],
      ['assignments', '🔗', 'الربط'],
      ['permissions', '🔐', 'الصلاحيات'],
      ['reports', '📊', 'التقارير'],
      ['settings', '⚙️', 'الإعدادات'],
      ...(currentUser.username === 'ميثاق2'
        ? [['requestManagers', '👥', 'مسؤولي الطلبات']]
        : []),
    ];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topHeader}>
          <View><Text style={styles.headerTitle}>لوحة التحكم والإدارة</Text><Text style={styles.headerSub}>مرحبًا، {currentUser.name}</Text></View>
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
          {adminTab === 'settings' ? renderUserSettings() : null}
          {adminTab === 'requestManagers' && currentUser.username === 'ميثاق2' ? renderRequestManagersAdmin() : null}
        </ScrollView>

        <Modal visible={!!codingModal} transparent animationType="slide" onRequestClose={() => setCodingModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>تكويد {codingModal}</Text>
              <TextInput style={styles.input} value={newItem} onChangeText={setNewItem} placeholder="اسم العنصر" textAlign="right" />
              <TouchableOpacity style={styles.primaryBtn} onPress={saveCodingItem}><Text style={styles.btnText}>إضافة عنصر</Text></TouchableOpacity>
              <ScrollView style={{maxHeight:320}}>
                {codingModal ? codingMap[codingModal].map((item,index) => (
                  <View key={`${item}-${index}`} style={styles.inlineRow}>
                    <Text style={{flex:1,textAlign:'right'}}>{item}</Text>
                    <TouchableOpacity onPress={() => deleteCodingItem(codingModal,index)}><Text style={styles.deleteText}>حذف</Text></TouchableOpacity>
                  </View>
                )) : null}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setCodingModal(null); setNewItem(''); }}><Text style={styles.btnText}>إغلاق</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // واجهة حساب المستخدم العادي
  const isManagerOrAdminUser = currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'direct_manager' || currentUser?.role === 'services_manager';
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topHeader}>
        <View><Text style={styles.headerTitle}>السيارة {currentUser.id}</Text><Text style={styles.headerSub}>{currentUser.driver}</Text></View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:110}}>
        {userTab === 'service' && renderMyRequestsAndReports()}
        {userTab === 'driver_requests' && isManagerOrAdminUser && renderRequestsAdmin()}
        {userTab === 'reports' ? renderUserReportsSection() : null}
        {userTab === 'settings' ? renderUserSettings() : null}
      </ScrollView>

      {/* شريط التنقل السفلي المتناسق مع الهاتف (النقطة رقم 4: ضمان عدم اختفاء الأزرار) */}
      <View style={styles.driverNav}>
        {[
          ['service','🏠','الرئيسية'],
          ...(isManagerOrAdminUser ? [['driver_requests', '📋', 'طلبات السائقين']] : []),
          ['reports','📊','التقارير'],
          ['settings','⚙️','الإعدادات']
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
  loginTitle:{textAlign:'center',fontSize:22,fontWeight:'900',color:COLORS.primary,marginBottom:20},
  input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:12},
  primaryBtn:{backgroundColor:COLORS.primary,borderRadius:12,padding:13,alignItems:'center',marginTop:6},
  secondaryBtn:{backgroundColor:COLORS.primaryDark,borderRadius:12,padding:12,alignItems:'center',marginTop:10},
  btnText:{color:'#fff',fontWeight:'800',textAlign:'center'},
  topHeader:{backgroundColor:COLORS.primary,paddingHorizontal:18,paddingVertical:15,flexDirection:'row-reverse',alignItems:'center',gap:12},
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
  card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:11,borderWidth:1,borderColor:'#EEF2F7',elevation:1},
  cardHeader:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  cardId:{color:COLORS.primary,fontWeight:'800',fontSize:15},
  cardTitle:{textAlign:'right',fontWeight:'800',fontSize:16,color:COLORS.text,marginBottom:5},
  cardText:{textAlign:'right',color:'#475569',marginBottom:4},
  badge:{backgroundColor:'#FFF4E5',color:'#9A5B00',paddingHorizontal:9,paddingVertical:4,borderRadius:10,fontSize:12,fontWeight:'700'},
  actionRow:{flexDirection:'row-reverse',gap:8,marginTop:10},
  actionBtn:{flex:1,borderRadius:10,padding:11,alignItems:'center'},
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
  importBtn:{backgroundColor:COLORS.primaryDark,borderRadius:12,padding:12,alignItems:'center',marginVertical:10},
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
  totalText:{color:COLORS.primary,fontSize:18,fontWeight:'900',textAlign:'right',marginVertical:8},
  previewImage:{width:110,height:110,borderRadius:12,alignSelf:'flex-end',marginVertical:8},
  serviceCard:{backgroundColor:'#fff',borderRadius:18,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7',elevation:1},
  serviceIcon:{width:55,height:55,borderRadius:17,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  serviceTitle:{textAlign:'right',fontWeight:'900',fontSize:16,color:COLORS.text},
  serviceSub:{textAlign:'right',color:COLORS.muted,fontSize:12,marginTop:3},
  driverNav:{flexDirection:'row-reverse',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.border,paddingVertical:7},
  driverNavItem:{flex:1,alignItems:'center',paddingVertical:7},
  driverNavText:{color:'#64748B',fontSize:11,fontWeight:'600'},
  activeNavText:{color:COLORS.primary,fontWeight:'900'},
  workflowTitle:{textAlign:'right',fontWeight:'800',color:COLORS.primary,marginTop:7},
  dropdownInput:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:13,marginBottom:10},
  driverOption:{padding:14,borderBottomWidth:1,borderBottomColor:'#EEF2F7'},
  driverOptionText:{textAlign:'right',fontWeight:'700',color:COLORS.text},
  requestTabs:{backgroundColor:'#fff',borderRadius:12,marginBottom:12,borderWidth:1,borderColor:COLORS.border},
  requestTab:{paddingHorizontal:14,paddingVertical:11,borderBottomWidth:3,borderBottomColor:'transparent'},
  requestTabActive:{borderBottomColor:COLORS.primary,backgroundColor:'#FFF5F5'},
  requestTabText:{color:COLORS.muted,fontWeight:'700',fontSize:12},
  requestTabTextActive:{color:COLORS.primary,fontWeight:'900'},
  emptyCard:{backgroundColor:'#fff',borderRadius:16,padding:22,alignItems:'center',marginBottom:12},
  emptyText:{color:COLORS.muted,fontWeight:'700',textAlign: 'center'},
  requestImage:{width:170,height:170,borderRadius:14,alignSelf:'flex-end',marginTop:10},
  requestModalScreen:{flex:1,backgroundColor:COLORS.bg},
  requestModalHeader:{backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:12,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:COLORS.border},
  closeText:{color:COLORS.primary,fontWeight:'900',fontSize:14},
  requestFormScroll:{flex:1},
  requestFormContent:{padding:16,paddingBottom:30},
  requestFooter:{backgroundColor:'#fff',padding:10,borderTopWidth:1,borderTopColor:COLORS.border,flexDirection:'row-reverse'},
  readOnlyInput:{backgroundColor:'#E2E8F0',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
});

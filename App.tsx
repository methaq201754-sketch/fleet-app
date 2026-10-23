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

const APP_VERSION = '1.78.38';
const APP_BUILD = '78';
const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F4F7FB', card: '#FFFFFF', text: '#263238', muted: '#718096',
  border: '#E2E8F0', success: '#2E7D32', warning: '#ED8B00', danger: '#C62828',
};

type Vehicle = {
  id: string; carNumber: string; name: string; driver: string; status: string; type: string;
  model: string; payload: string; fuelType: string; engineNo: string; chassisNo: string;
  ownership?: 'شركة' | 'خاصة';
  directManager?: string;
  directManagerId?: string;
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

// حساب ميثاق2 قد يكون اسمه التقني methaq2 في Supabase، وليس الاسم العربي.
const isRequestApprover = (user: any) => {
  const username = String(user?.username || '').trim().toLowerCase().replace(/\s+/g, '');
  const role = String(user?.role || user?.profile?.role || '').trim().toLowerCase();
  const extraRoles = Array.isArray(user?.extraRoles) ? user.extraRoles.map((r: any) => String(r).toLowerCase()) : [];
  return ['ميثاق2', 'ميثاق٢', 'methaq2', 'methaq_2', 'methaq-2'].includes(username) ||
    extraRoles.includes('request_approver') || extraRoles.includes('system_admin');
};

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
  
  const [requestManagersTab, setRequestManagersTab] = useState('distribute');
  const [managerProfiles, setManagerProfiles] = useState<any[]>([]);
  const [workflowRoutes, setWorkflowRoutes] = useState<string[]>(['المسؤول المباشر', 'الخدمات الإدارية', 'المسؤول النهائي']);
  const [newRouteName, setNewRouteName] = useState('');
  const [userTab, setUserTab] = useState('service');
  const [adminTab, setAdminTab] = useState('requests');
  const [loadingDb, setLoadingDb] = useState(false);
  
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [savingManager, setSavingManager] = useState(false);
  const [managerAssignModal, setManagerAssignModal] = useState(false);
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState<any>(null);
  const [chosenDirectManager, setChosenDirectManager] = useState('');

  const [tripTypes, setTripTypes] = useState<string[]>(['مهمة عمل','توصيل مواد','مراجعة جهة']);
  const [tripDestinations, setTripDestinations] = useState<string[]>(['صنعاء','عدن','الحديدة','إب','ذمار','رداع']);
  
  const [adminRequestTab, setAdminRequestTab] = useState('وقود');
  const [pricingCategoryModal, setPricingCategoryModal] = useState<string | null>(null);
  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  const [editingDispatchRequest, setEditingDispatchRequest] = useState<RequestItem | null>(null);
  const [previewDispatchRequest, setPreviewDispatchRequest] = useState<RequestItem | null>(null);
  const [dispatchEditForm, setDispatchEditForm] = useState({ workshop: '', engineer: '', faultType: '', requiredWork: '', client: '', serviceDescription: '', notes: '' });
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
  
  const [assignmentSearchCar, setAssignmentSearchCar] = useState('');
  const [assignmentSearchDriver, setAssignmentSearchDriver] = useState('');
  const [assignmentStartDate, setAssignmentStartDate] = useState(TODAY());
  const [assignmentEndDate, setAssignmentEndDate] = useState('');

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
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [driverEditId, setDriverEditId] = useState<number | null>(null);
  const [driverForm, setDriverForm] = useState({ driver_name: '', plate_number: '', phone: '', status: 'active' });
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
      const { data: pData, error: pError } = await supabase.from('profiles').select('id, username, full_name, role, phone, is_active');
      if (!pError && pData) setManagerProfiles(pData);
      const profilesForLookup = pData || [];
      const { data: dData, error: dError } = await supabase
        .from('drivers')
        .select('id, driver_name, plate_number, phone, status, created_at')
        .order('driver_name', { ascending: true });
      if (!dError && dData) setDrivers(dData);

      const { data: vData, error: vError } = await supabase.from('vehicles').select('*').order('id', { ascending: true });
      if (vError) throw vError;
      if (vData) {
        const driverRows = dData || [];
        const mappedFleet: Vehicle[] = vData.map((v: any) => {
          const assignedProfile = profilesForLookup.find((p: any) => String(p.id) === String(v.direct_manager_id || ''));
          const carNo = String(v.car_number || '').trim();
          const matchedDriver = driverRows.find((d: any) => String(d.plate_number || '').trim() === carNo);
          return {
            id: String(v.id),
            carNumber: carNo,
            name: v.car_name || `سيارة ${carNo}`,
            driver: matchedDriver?.driver_name || '',
            status: v.status || 'في الخدمة',
            type: v.brand || 'سيارة',
            model: String(v.model || v.manufacturing_year || ''),
            payload: v.load_capacity || '',
            fuelType: v.fuel_type || 'ديزل',
            engineNo: v.engine_number || '',
            chassisNo: v.chassis_number || '',
            ownership: v.ownership === 'خاصة' ? 'خاصة' : 'شركة',
            directManager: v.direct_manager || v.directManager || assignedProfile?.full_name || assignedProfile?.username || '',
            directManagerId: v.direct_manager_id ? String(v.direct_manager_id) : ''
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
    } catch (e: any) {
      console.log('Supabase Fetch Error:', e?.message || e);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserProfileAndRestore(session.user);
        await loadSupabaseData();
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
      const isAdmin = ['admin', 'administrator', 'manager', 'services_manager', 'direct_manager', 'request_approver', 'system_admin', 'مسؤول', 'مدير', 'مدير عام', 'مدير الخدمات', 'مسؤول الخدمات'].includes(roleRaw);
      
      if (isAdmin) {
        let extraRoles: string[] = [];
        const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        if (roleRows) extraRoles = roleRows.map((row: any) => String(row.role || '').toLowerCase());
        setCurrentUser({ role: roleRaw === 'admin' ? 'admin' : 'manager', authId: user.id, username: profile.username, name: profile.full_name || profile.username, profile, extraRoles });
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
      await loadSupabaseData();
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

  // دالة إرسال الطلب المحدثة بالجزء المطلوب
  const submitRequest = async () => {
    if (!currentUser || !serviceTypeModal) return;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      Alert.alert(
        'خطأ في جلسة الدخول',
        authError?.message || 'لا توجد جلسة دخول موثقة.'
      );
      return;
    }

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
        vehicle_id: item.vehicleId, applicant_id: user.id,
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
        isRequestApprover(currentUser)
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

  const saveAssignManager = async () => {
    if (!selectedVehicleForAssign || !chosenDirectManager) {
      Alert.alert('تنبيه', 'اختر المسؤول أولاً.');
      return;
    }

    setSavingManager(true);

    try {
      const { data, error } = await supabase.rpc(
        'assign_vehicle_manager',
        {
          p_vehicle_id: Number(selectedVehicleForAssign.id),
          p_manager_id: chosenDirectManager,
        }
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error('لم يتم تأكيد حفظ التعيين.');
      }

      const manager = availableManagers.find(
        (m: any) => m.id === chosenDirectManager
      );

      setFleet((prev: any[]) =>
        prev.map((v: any) =>
          String(v.id) === String(selectedVehicleForAssign.id)
            ? { ...v, directManager: manager?.full_name || manager?.username, directManagerId: String(chosenDirectManager) }
            : v
        )
      );

      setManagerAssignModal(false);
      Alert.alert('نجاح', 'تم حفظ المسؤول في قاعدة البيانات.');
    } catch (error: any) {
      Alert.alert(
        'فشل الحفظ',
        error?.message || 'تعذر حفظ تعيين المسؤول.'
      );
    } finally {
      setSavingManager(false);
    }
  };

  const openDispatchEditor = (req: RequestItem) => {
    setDispatchEditForm({
      workshop: req.workshop || '',
      engineer: req.engineer || '',
      faultType: req.faultType || '',
      requiredWork: req.requiredWork || '',
      client: req.client || '',
      serviceDescription: req.serviceDescription || '',
      notes: req.notes || '',
    });
    setEditingDispatchRequest(req);
  };

  const saveDispatchEdits = async () => {
    if (!editingDispatchRequest) return;
    const updated: RequestItem = {
      ...editingDispatchRequest,
      workshop: dispatchEditForm.workshop.trim(),
      engineer: dispatchEditForm.engineer.trim(),
      faultType: dispatchEditForm.faultType.trim(),
      requiredWork: dispatchEditForm.requiredWork.trim(),
      client: dispatchEditForm.client.trim(),
      serviceDescription: dispatchEditForm.serviceDescription.trim(),
      notes: dispatchEditForm.notes.trim(),
    };

    if (updated.type === 'إرسالية صيانة' &&
        (!updated.workshop || !updated.engineer || !updated.faultType || !updated.requiredWork)) {
      Alert.alert('بيانات ناقصة', 'أكمل الورشة والمهندس والعطل والعمل المطلوب قبل الحفظ.');
      return;
    }
    if (updated.type === 'إرسالية خدمات بنشر' &&
        (!updated.client || !updated.serviceDescription)) {
      Alert.alert('بيانات ناقصة', 'أكمل اسم العميل ووصف الخدمة قبل الحفظ.');
      return;
    }

    try {
      setLoadingDb(true);
      const { error } = await supabase
        .from('requests')
        .update({ notes: makeStoredNotes(updated) })
        .eq('id', Number(updated.id));
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditingDispatchRequest(null);
      Alert.alert('تم الحفظ', 'تم حفظ تعديلات الإرسالية في قاعدة البيانات. يمكنك الآن معاينة النموذج وطباعته.');
      await loadSupabaseData();
    } catch (e: any) {
      Alert.alert('تعذر حفظ التعديلات', e?.message || 'تحقق من صلاحيات تحديث جدول requests.');
    } finally {
      setLoadingDb(false);
    }
  };

  const handlePreviewPrintCarRepair = async (req: RequestItem) => {
    // المعاينة تفتح داخل التطبيق فقط؛ الطباعة لها زر مستقل.
    setPreviewDispatchRequest(req);
  };

  const printMaintenanceDispatch = async () => {
    const req = previewDispatchRequest;
    if (!req) return;
    try {
      setLoadingDb(true);
      const { data: templateRow, error: templateError } = await supabase
        .from('document_templates')
        .select('template_html')
        .eq('template_key', 'maintenance_dispatch')
        .eq('is_active', true)
        .single();
      if (templateError) throw new Error('تعذر جلب نموذج إرسالية الصيانة من قاعدة البيانات: ' + templateError.message);
      if (!templateRow?.template_html) throw new Error('نموذج إرسالية الصيانة غير موجود أو غير مفعّل في قاعدة البيانات.');
      const vInfo = fleet.find(v => String(v.carNumber) === String(req.vehicleId));
      const values: Record<string, string> = {
        company: 'الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة - تعز',
        department: 'الخدمات الإدارية', date: escapeHtml(req.date || ''),
        request_no: escapeHtml(req.id || ''), workshop: escapeHtml(req.workshop || 'ورشة الصيانة'),
        car_number: escapeHtml(req.vehicleId || ''), car_name: escapeHtml(vInfo?.name || ''),
        car_type: escapeHtml(vInfo?.type || ''), model: escapeHtml(vInfo?.model || ''),
        driver: escapeHtml(req.driver || ''), fault: escapeHtml(req.faultType || req.notes || ''),
        required_work: escapeHtml(req.requiredWork || ''), client: escapeHtml(req.client || 'الجهة المعنية'),
      };
      let html = String(templateRow.template_html);
      for (const [key, value] of Object.entries(values)) {
        html = html.replace(new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'g'), value);
      }
      // طباعة A4 عبر نظام الطباعة في الجهاز؛ لا ننشئ ملفًا تلقائيًا عند فتح المعاينة.
      await Print.printAsync({ html, width: 595, height: 842 });
    } catch (e: any) {
      Alert.alert('تعذر طباعة إرسالية الصيانة', e?.message || 'تحقق من اتصال قاعدة البيانات وصلاحيات جدول document_templates.');
    } finally {
      setLoadingDb(false);
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
      const isFinalApprover = isRequestApprover(currentUser);
      if (isFinalApprover) {
        // ميثاق يرى الطلبات المحالة للخدمات وكذلك الطلبات المعتمدة نهائياً حتى يتمكن من طباعتها.
        return (
          r.directManagerStatus === 'موافق' &&
          r.servicesStatus !== 'مرفوض' &&
          r.status !== 'مرفوض'
        );
      }
      const isPendingDirectApproval =
        !r.directManagerStatus ||
        ['تحت المراجعة', 'بانتظار المراجعة', 'قيد المراجعة'].includes(r.directManagerStatus);
      const requestVehicle = fleet.find((v: any) => String(v.id) === String(r.vehicleId));
      const managerAssigned = String(requestVehicle?.directManagerId || '');
      const currentProfileId = String(currentUser?.authId || currentUser?.profile?.id || '');
      const assignedToThisManager = !managerAssigned || managerAssigned === currentProfileId ||
        String(requestVehicle?.directManager || '').trim() === String(currentUser?.name || '').trim() ||
        String(requestVehicle?.directManager || '').trim() === String(currentUser?.username || '').trim();
      return (
        isPendingDirectApproval && assignedToThisManager &&
        r.status !== 'مرفوض' && r.status !== 'تمت الموافقة'
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

            {(r.type === 'إرسالية صيانة' || r.type === 'إرسالية خدمات بنشر') && isRequestApprover(currentUser) && r.status !== 'تمت الموافقة' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#0F766E'}]} onPress={() => openDispatchEditor(r)}>
                  <Text style={styles.btnText}>تعديل الإرسالية وحفظها</Text>
                </TouchableOpacity>
              </View>
            )}
            {r.type === 'إرسالية صيانة' && (r.status === 'تمت الموافقة' || isRequestApprover(currentUser)) && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB'}]} onPress={() => handlePreviewPrintCarRepair(r)}>
                  <Text style={styles.btnText}>معاينة نموذج الإرسالية</Text>
                </TouchableOpacity>
              </View>
            )}
            {r.type === 'إرسالية خدمات بنشر' && (r.status === 'تمت الموافقة' || isRequestApprover(currentUser)) && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB'}]} onPress={() => handlePreviewPrintPunctureService(r)}>
                  <Text style={styles.btnText}>معاينة وطباعة نموذج الإرسالية</Text>
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
        <TouchableOpacity style={styles.importBtn} onPress={loadSupabaseData}><Text style={styles.btnText}>تحديث قائمة المسؤولين والسيارات</Text></TouchableOpacity>
        <View style={{flexDirection: 'row-reverse', gap: 6, marginBottom: 15}}>
          {['توزيع المسؤولين', 'قائمة المسؤولين', 'الصلاحيات', 'مسارات الطلبات'].map((tab, idx) => {
            const keys = ['distribute', 'list', 'permissions', 'routes'];
            const active = requestManagersTab === keys[idx];
            return (
              <TouchableOpacity key={keys[idx]} onPress={() => setRequestManagersTab(keys[idx])}
                style={[styles.choice, active && styles.choiceActive, {flex: 1, alignItems: 'center'}]}>
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {requestManagersTab === 'distribute' && isRequestApprover(currentUser) && (
          <ScrollView style={{ flex: 1 }}>
            <View style={styles.adminAssignBox}>
              <Text style={styles.adminAssignTitle}>
                🛡️ توزيع المسؤولين على السيارات
              </Text>

              {fleet.length === 0 ? <Text style={styles.emptyText}>لا توجد سيارات محمّلة. اضغط تحديث القائمة أو تحقق من صلاحيات جدول vehicles.</Text> : null}
              {fleet.map((v: any) => (
                <View key={String(v.id)} style={styles.assignRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', textAlign: 'right' }}>
                      السيارة رقم {v.carNumber || v.car_number || v.id}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      textAlign: 'right'
                    }}>
                      المسؤول المباشر: {v.directManager || 'غير معيّن'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.smallAssignBtn}
                    onPress={async () => {
                      setSelectedVehicleForAssign(v);
                      setChosenDirectManager('');
                      const { data, error } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, role, is_active')
                        .eq('is_active', true)
                        .order('full_name');

                      if (error) {
                        Alert.alert('تعذر تحميل المسؤولين', error.message);
                        return;
                      }
                      const eligible = (data || []).filter((m: any) =>
                        ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())
                      );
                      setAvailableManagers(eligible);
                      if (!eligible.length) Alert.alert('لا يوجد مسؤولون', 'لم يُعثر على حسابات مفعّلة بأدوار مسؤول أو مدير في جدول profiles.');
                      setManagerAssignModal(true);
                    }}
                  >
                    <Text style={styles.smallAssignText}>
                      تعيين / تغيير
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {requestManagersTab === 'list' && (
          <View>
            <Text style={[styles.sectionTitle, {fontSize: 16}]}>قائمة المسؤولين الحاليين</Text>
            {managerProfiles.filter(m => m.is_active !== false && ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())).length === 0 ? <Text style={styles.emptyText}>لم تُحمّل حسابات المسؤولين. اضغط تحديث القائمة، وإذا استمر الفراغ فتحقق من صلاحية SELECT على profiles.</Text> : null}
            {managerProfiles.filter(m => m.is_active !== false && ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())).map(m => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.cardTitle}>{m.full_name || m.username}</Text>
                <Text style={styles.cardText}>اسم الدخول: {m.username}</Text>
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
            {managerProfiles.filter(m => m.is_active !== false && ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())).map(m => (
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
        car_number: vehicleForm.carNumber.trim(),
        car_name: vehicleForm.name.trim(),
        brand: vehicleForm.type.trim() || null,
        manufacturing_year: Number(vehicleForm.model) || null,
        model: vehicleForm.model.trim() || null,
        load_capacity: vehicleForm.payload.trim() || null,
        engine_number: vehicleForm.engineNo.trim() || null,
        chassis_number: vehicleForm.chassisNo.trim() || null,
        fuel_type: vehicleForm.fuelType || 'ديزل',
        ownership: vehicleForm.ownership || 'شركة',
        status: vehicleForm.status || 'في الخدمة'
      };
      try {
        let result: any;
        if (vehicleEditId) {
          result = await supabase.from('vehicles').update(row).eq('id', Number(vehicleEditId));
        } else {
          // vehicles.id is BIGINT without an automatic default in the current schema.
          const { data: lastRows, error: lastError } = await supabase
            .from('vehicles').select('id').order('id', { ascending: false }).limit(1);
          if (lastError) throw lastError;
          const nextId = Number(lastRows?.[0]?.id || 0) + 1;
          result = await supabase.from('vehicles').insert({ id: nextId, ...row });
        }
        if (result.error) throw result.error;
        setVehicleModalVisible(false);
        Alert.alert('تم الحفظ', 'تم حفظ بيانات السيارة في جدول vehicles.');
        await loadSupabaseData();
      } catch (e: any) { Alert.alert('تعذر حفظ السيارة', e?.message || 'تحقق من صلاحيات جدول vehicles.'); }
    };

    const deleteVehicle = (v: Vehicle) => {
      Alert.alert('تأكيد حذف السيارة', `هل تريد حذف السيارة رقم ${v.carNumber}؟ قد تمنع السجلات المرتبطة حذفها.`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase.from('vehicles').delete().eq('id', Number(v.id));
            if (error) throw error;
            Alert.alert('تم الحذف', 'حُذفت السيارة من قاعدة البيانات.');
            await loadSupabaseData();
          } catch (e: any) {
            Alert.alert('تعذر حذف السيارة', e?.message || 'قد توجد طلبات أو تعيينات مرتبطة بهذه السيارة.');
          }
        }}
      ]);
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
            <Text style={styles.cardText}>الملكية: {v.ownership || 'شركة'} | الوقود: {v.fuelType || 'ديزل'}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => openEditVehicle(v)}>
                <Text style={styles.btnText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger }]} onPress={() => deleteVehicle(v)}>
                <Text style={styles.btnText}>حذف</Text>
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
                  ['carNumber','رقم السيارة (car_number)'], ['name','اسم السيارة'], ['type','الماركة / النوع'],
                  ['model','الموديل أو سنة الصنع'], ['payload','الحمولة / السعة'], ['engineNo','رقم المحرك'], ['chassisNo','رقم الشاسيه']
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
                <Text style={styles.label}>نوع الملكية</Text>
                <View style={styles.choiceRow}>
                  {['شركة', 'خاصة'].map(value => (
                    <TouchableOpacity key={value} style={[styles.choice, vehicleForm.ownership === value && styles.choiceActive]}
                      onPress={() => setVehicleForm(p => ({ ...p, ownership: value as any }))}>
                      <Text style={[styles.choiceText, vehicleForm.ownership === value && styles.choiceTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>الحالة</Text>
                <View style={styles.choiceRow}>
                  {['في الخدمة', 'موقف'].map(value => (
                    <TouchableOpacity key={value} style={[styles.choice, vehicleForm.status === value && styles.choiceActive]}
                      onPress={() => setVehicleForm(p => ({ ...p, status: value }))}>
                      <Text style={[styles.choiceText, vehicleForm.status === value && styles.choiceTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>نوع الوقود</Text>
                <View style={styles.choiceRow}>
                  {['ديزل', 'بترول'].map(value => (
                    <TouchableOpacity key={value} style={[styles.choice, vehicleForm.fuelType === value && styles.choiceActive]}
                      onPress={() => setVehicleForm(p => ({ ...p, fuelType: value }))}>
                      <Text style={[styles.choiceText, vehicleForm.fuelType === value && styles.choiceTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={saveVehicle}><Text style={styles.btnText}>حفظ السيارة</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVehicleModalVisible(false)}><Text style={styles.btnText}>إلغاء</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

  const renderDrivers = () => {
    const openAddDriver = () => {
      setDriverEditId(null);
      setDriverForm({ driver_name: '', plate_number: '', phone: '', status: 'active' });
      setDriverModalVisible(true);
    };

    const openEditDriver = (driver: any) => {
      setDriverEditId(Number(driver.id));
      setDriverForm({
        driver_name: String(driver.driver_name || ''),
        plate_number: String(driver.plate_number || ''),
        phone: String(driver.phone || ''),
        status: String(driver.status || 'active')
      });
      setDriverModalVisible(true);
    };

    const saveDriver = async () => {
      if (!driverForm.driver_name.trim()) {
        Alert.alert('بيانات ناقصة', 'أدخل اسم السائق قبل الحفظ.');
        return;
      }
      const row = {
        driver_name: driverForm.driver_name.trim(),
        plate_number: driverForm.plate_number.trim() || null,
        phone: driverForm.phone.trim() || null,
        status: driverForm.status || 'active'
      };
      try {
        setLoadingDb(true);
        const result = driverEditId
          ? await supabase.from('drivers').update(row).eq('id', driverEditId)
          : await supabase.from('drivers').insert(row);
        if (result.error) throw result.error;
        setDriverModalVisible(false);
        Alert.alert('تم الحفظ', 'تم حفظ بيانات السائق في جدول drivers.');
        await loadSupabaseData();
      } catch (e: any) {
        Alert.alert('تعذر حفظ السائق', e?.message || 'تحقق من صلاحيات جدول drivers.');
      } finally {
        setLoadingDb(false);
      }
    };

    const deleteDriver = (driver: any) => {
      Alert.alert('تأكيد حذف السائق', `هل تريد حذف السائق ${driver.driver_name}؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: async () => {
          try {
            setLoadingDb(true);
            const { error } = await supabase.from('drivers').delete().eq('id', Number(driver.id));
            if (error) throw error;
            Alert.alert('تم الحذف', 'حُذف السائق من قاعدة البيانات.');
            await loadSupabaseData();
          } catch (e: any) {
            Alert.alert('تعذر حذف السائق', e?.message || 'قد توجد طلبات مرتبطة بهذا السائق.');
          } finally {
            setLoadingDb(false);
          }
        }}
      ]);
    };

    return (
      <View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.sectionTitle}>السائقون ({drivers.length})</Text>
          <TouchableOpacity style={styles.smallPrimary} onPress={openAddDriver}>
            <Text style={styles.btnText}>＋ إضافة سائق</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helper}>تُقرأ البيانات وتُحفظ مباشرة في جدول drivers في Supabase.</Text>
        <TouchableOpacity style={styles.importBtn} onPress={loadSupabaseData}>
          <Text style={styles.btnText}>🔄 تحديث قائمة السائقين</Text>
        </TouchableOpacity>
        {drivers.map((driver: any) => (
          <View key={String(driver.id)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>👤 {driver.driver_name}</Text>
              <Text style={styles.badge}>{driver.status === 'active' ? 'نشط' : driver.status || 'غير محدد'}</Text>
            </View>
            <Text style={styles.cardText}>رقم السيارة: {driver.plate_number || 'غير مرتبط'}</Text>
            <Text style={styles.cardText}>الهاتف: {driver.phone || 'غير مسجل'}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => openEditDriver(driver)}>
                <Text style={styles.btnText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger }]} onPress={() => deleteDriver(driver)}>
                <Text style={styles.btnText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <Modal visible={driverModalVisible} transparent animationType="slide" onRequestClose={() => setDriverModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.modalCenter, { paddingBottom: 36 }]}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{driverEditId ? 'تعديل بيانات سائق' : 'إضافة سائق جديد'}</Text>
                <Text style={styles.label}>اسم السائق *</Text>
                <TextInput style={styles.input} value={driverForm.driver_name}
                  onChangeText={value => setDriverForm(p => ({ ...p, driver_name: value }))}
                  textAlign="right" placeholder="اسم السائق" />
                <Text style={styles.label}>رقم السيارة (plate_number)</Text>
                <TextInput style={styles.input} value={driverForm.plate_number}
                  onChangeText={value => setDriverForm(p => ({ ...p, plate_number: value }))}
                  textAlign="right" keyboardType="default" placeholder="مثال: 22618" />
                <Text style={styles.label}>رقم الهاتف</Text>
                <TextInput style={styles.input} value={driverForm.phone}
                  onChangeText={value => setDriverForm(p => ({ ...p, phone: value }))}
                  textAlign="right" keyboardType="phone-pad" placeholder="رقم الهاتف" />
                <Text style={styles.label}>الحالة</Text>
                <View style={styles.choiceRow}>
                  {[['active', 'نشط'], ['inactive', 'غير نشط']].map(([value, label]) => (
                    <TouchableOpacity key={value} style={[styles.choice, driverForm.status === value && styles.choiceActive]}
                      onPress={() => setDriverForm(p => ({ ...p, status: value }))}>
                      <Text style={[styles.choiceText, driverForm.status === value && styles.choiceTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryBtn} disabled={loadingDb} onPress={saveDriver}>
                  <Text style={styles.btnText}>{loadingDb ? 'جارٍ الحفظ...' : 'حفظ السائق'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDriverModalVisible(false)}>
                  <Text style={styles.btnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

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

        <Text style={styles.label}>تاريخ بداية الربط</Text>
        <TextInput 
          style={styles.input} 
          value={assignmentStartDate} 
          onChangeText={setAssignmentStartDate} 
          placeholder="YYYY-MM-DD" 
          textAlign="right" 
        />

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

  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    const adminNav = [
      ['requests', '📋', 'الطلبات'],
      ['coding', '🧩', 'التكويدات'],
      ['pricing', '💰', 'الأسعار'],
      ['fleet', '🚗', 'السيارات'],
      ['drivers', '👤', 'السائقون'],
      ['assignments', '🔗', 'الربط'],
      ['permissions', '🔐', 'الصلاحيات'],
      ['reports', '📊', 'التقارير'],
      ['settings', '⚙️', 'الإعدادات'],
      ...(isRequestApprover(currentUser)
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
          {adminTab === 'drivers' ? renderDrivers() : null}
          {adminTab === 'assignments' ? renderAssignments() : null}
          {adminTab === 'permissions' ? renderPermissions() : null}
          {adminTab === 'reports' ? renderReports(true) : null}
          {adminTab === 'settings' ? renderUserSettings() : null}
          {adminTab === 'requestManagers' && isRequestApprover(currentUser) ? renderRequestManagersAdmin() : null}
        </ScrollView>

        <Modal
          visible={managerAssignModal}
          transparent
          animationType="slide"
          onRequestClose={() => setManagerAssignModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                تعيين مسؤول للسيارة رقم {
                  selectedVehicleForAssign?.carNumber ??
                  selectedVehicleForAssign?.car_number ??
                  selectedVehicleForAssign?.id
                }
              </Text>

              <Text style={styles.label}>
                اختر المسؤول:
              </Text>

              <ScrollView style={{ maxHeight: 280 }}>
                {availableManagers.map((mgr: any) => (
                  <TouchableOpacity
                    key={mgr.id}
                    style={[
                      styles.mgrOption,
                      chosenDirectManager === mgr.id &&
                        styles.mgrOptionActive
                    ]}
                    onPress={() => setChosenDirectManager(mgr.id)}
                  >
                    <Text style={styles.mgrOptionText}>
                      {mgr.full_name} — {mgr.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.primaryBtnLarge}
                disabled={savingManager}
                onPress={saveAssignManager}
              >
                <Text style={styles.btnTextLarge}>
                  {savingManager ? 'جارٍ الحفظ...' : 'حفظ التعيين'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setManagerAssignModal(false)}
              >
                <Text style={styles.btnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={!!previewDispatchRequest} animationType="slide" onRequestClose={() => setPreviewDispatchRequest(null)}>
          <SafeAreaView style={{flex:1,backgroundColor:'#EEF1F5'}}>
            <View style={{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',padding:14,backgroundColor:'#fff',borderBottomWidth:1,borderColor:'#D1D5DB'}}>
              <Text style={{fontSize:18,fontWeight:'900',color:'#202124'}}>معاينة إرسالية الصيانة</Text>
              <TouchableOpacity onPress={() => setPreviewDispatchRequest(null)}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding:12,alignItems:'center'}}>
              <View style={{width:'100%',maxWidth:520,backgroundColor:'#fff',padding:16,borderWidth:1,borderColor:'#9CA3AF',minHeight:720}}>
                <Text style={{textAlign:'center',fontSize:17,fontWeight:'900',color:'#111827'}}>الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة - تعز</Text>
                <Text style={{textAlign:'center',fontSize:13,fontWeight:'700',marginTop:5}}>الخدمات الإدارية</Text>
                <Text style={{textAlign:'center',fontSize:18,fontWeight:'900',textDecorationLine:'underline',marginVertical:12,color:'#111827'}}>طلب إصلاح سيارة</Text>
                <View style={{borderWidth:1,borderColor:'#4B5563',padding:10,marginBottom:10}}>
                  <Text style={{textAlign:'right',fontWeight:'700',marginBottom:8}}>التاريخ: {previewDispatchRequest?.date || ''}     الرقم: {previewDispatchRequest?.id || ''}</Text>
                  <Text style={{textAlign:'right',marginBottom:8}}>الأخوة / {previewDispatchRequest?.workshop || '................................'} المحترمون</Text>
                  <Text style={{textAlign:'right',fontWeight:'700',marginBottom:8}}>بعد التحية،، يرجى إجراء ما يلي على السيارة المذكورة أدناه وإفادتنا بتقرير يوضح نوع العطل وسببه:</Text>
                  <Text style={{textAlign:'right',marginBottom:6}}>1) نوع السيارة ورقمها: {previewDispatchRequest?.vehicleId || ''}</Text>
                  <Text style={{textAlign:'right',marginBottom:6}}>اسم السائق: {previewDispatchRequest?.driver || ''}</Text>
                  <Text style={{textAlign:'right',marginBottom:6}}>2) العمل المطلوب: {previewDispatchRequest?.requiredWork || ''}</Text>
                  <Text style={{textAlign:'right',marginBottom:6}}>وصف العطل: {previewDispatchRequest?.faultType || previewDispatchRequest?.notes || ''}</Text>
                  <Text style={{textAlign:'right',marginTop:16}}>الخدمات الإدارية __________________</Text>
                  <Text style={{textAlign:'center',marginTop:20,fontWeight:'800'}}>مدير الإدارة __________________   السائق __________________</Text>
                </View>
                <View style={{borderWidth:1,borderColor:'#4B5563',padding:10,minHeight:125,marginBottom:10}}>
                  <Text style={{textAlign:'right',fontWeight:'900'}}>الأخوة / الشركة اليمنية لصناعة الطلاء ومشتقاتها المحدودة</Text>
                  <Text style={{textAlign:'right',fontWeight:'700',marginTop:8}}>بعد فحص السيارة تبين أن بها ما يلي:</Text>
                  <Text style={{textAlign:'right',marginTop:10}}>........................................................................</Text>
                  <Text style={{textAlign:'right',fontWeight:'700',marginTop:8}}>وتحتاج إلى قطع الغيار التالية:</Text>
                  <Text style={{textAlign:'right',marginTop:10}}>........................................................................</Text>
                  <Text style={{textAlign:'left',marginTop:12,fontWeight:'800'}}>مسؤول الورشة __________________</Text>
                </View>
                <View style={{borderWidth:1,borderColor:'#4B5563',padding:10,minHeight:100,marginBottom:10}}>
                  <Text style={{textAlign:'right',fontWeight:'900'}}>الأخوة / {previewDispatchRequest?.workshop || 'الورشة'} المحترمون</Text>
                  <Text style={{textAlign:'right',marginTop:8}}>نوافق على الإصلاح.</Text>
                  <Text style={{textAlign:'left',marginTop:18,fontWeight:'800'}}>الخدمات الإدارية ____________     الجهة المعنية ____________</Text>
                </View>
                <View style={{borderWidth:1,borderColor:'#4B5563',padding:10,minHeight:80}}>
                  <Text style={{textAlign:'right',fontWeight:'900'}}>تم إصلاح عطل السيارة المذكورة أعلاه وتم تسليمها</Text>
                  <Text style={{textAlign:'left',marginTop:18,fontWeight:'800'}}>مسؤول الورشة ____________     توقيع المستلم ____________</Text>
                </View>
                <Text style={{textAlign:'center',fontSize:11,color:'#6B7280',marginTop:10}}>معاينة مبدئية للنموذج — الطباعة تستخدم القالب المعتمد المحفوظ في قاعدة البيانات.</Text>
              </View>
            </ScrollView>
            <View style={{padding:12,backgroundColor:'#fff',borderTopWidth:1,borderColor:'#D1D5DB'}}>
              <TouchableOpacity style={styles.primaryBtnLarge} disabled={loadingDb} onPress={printMaintenanceDispatch}>
                <Text style={styles.btnTextLarge}>{loadingDb ? 'جارٍ تجهيز الطباعة...' : 'طباعة / حفظ PDF — ورق A4'}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={!!editingDispatchRequest}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingDispatchRequest(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>تعديل بيانات الإرسالية #{editingDispatchRequest?.id}</Text>
              <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight: '78%'}}>
                {editingDispatchRequest?.type === 'إرسالية صيانة' ? (
                  <>
                    <Text style={styles.label}>الورشة</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.workshop} onChangeText={value => setDispatchEditForm(prev => ({...prev, workshop: value}))} textAlign="right" />
                    <Text style={styles.label}>المهندس</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.engineer} onChangeText={value => setDispatchEditForm(prev => ({...prev, engineer: value}))} textAlign="right" />
                    <Text style={styles.label}>سبب المشكلة / العطل</Text>
                    <TextInput style={[styles.input,{minHeight:75}]} value={dispatchEditForm.faultType} onChangeText={value => setDispatchEditForm(prev => ({...prev, faultType: value}))} multiline textAlign="right" />
                    <Text style={styles.label}>الإجراء المطلوب</Text>
                    <TextInput style={[styles.input,{minHeight:75}]} value={dispatchEditForm.requiredWork} onChangeText={value => setDispatchEditForm(prev => ({...prev, requiredWork: value}))} multiline textAlign="right" />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>العميل</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.client} onChangeText={value => setDispatchEditForm(prev => ({...prev, client: value}))} textAlign="right" />
                    <Text style={styles.label}>الخدمة المطلوبة / وصف الخدمة</Text>
                    <TextInput style={[styles.input,{minHeight:75}]} value={dispatchEditForm.serviceDescription} onChangeText={value => setDispatchEditForm(prev => ({...prev, serviceDescription: value}))} multiline textAlign="right" />
                  </>
                )}
                <Text style={styles.label}>ملاحظات</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={dispatchEditForm.notes} onChangeText={value => setDispatchEditForm(prev => ({...prev, notes: value}))} multiline textAlign="right" />
              </ScrollView>
              <TouchableOpacity style={styles.primaryBtnLarge} disabled={loadingDb} onPress={saveDispatchEdits}>
                <Text style={styles.btnTextLarge}>{loadingDb ? 'جارٍ الحفظ...' : 'حفظ التعديلات في قاعدة البيانات'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditingDispatchRequest(null)}>
                <Text style={styles.btnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  adminAssignBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  adminAssignTitle: { fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 15, color: COLORS.text },
  assignRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  smallAssignBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallAssignText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  mgrOption: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, backgroundColor: '#F8FAFC' },
  mgrOptionActive: { backgroundColor: '#FFF0F1', borderColor: COLORS.primary },
  mgrOptionText: { textAlign: 'right', fontWeight: '700', color: COLORS.text },
  primaryBtnLarge: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  btnTextLarge: { color: '#fff', fontWeight: '900', fontSize: 16, textAlign: 'center' },
});

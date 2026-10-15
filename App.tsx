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
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_VERSION = '1.54.18';
const APP_BUILD = '54';

const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F4F7FB', card: '#FFFFFF', text: '#263238', muted: '#718096',
  border: '#E2E8F0', success: '#2E7D32', warning: '#ED8B00', danger: '#C62828',
};

type Vehicle = {
  id: string; name: string; driver: string; status: string; type: string;
  model: string; payload: string; fuelType: string; engineNo: string; chassisNo: string;
  directManager?: string; ownership?: 'شركة' | 'خاصة';
};

type RequestItem = {
  id: string; vehicleId: string; driver: string; type: string; date: string;
  qty: number; total: number; status: string; notes?: string; imageUri?: string;
  station?: string; fuelType?: string; unit?: string; oilType?: string;
  itemName?: string; prevOdo?: number; currOdo?: number; distance?: number;
  workshop?: string; engineer?: string; faultType?: string; requiredWork?: string;
  client?: string; serviceDescription?: string; workflow?: string; approvalTrail?: string[];
  startDate?: string; endDate?: string; returnDate?: string; daysCount?: number;
  managerApproval?: string; adminApproval?: string; destination?: string; custody?: number;
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
  
  const [userTab, setUserTab] = useState('service');
  const [adminTab, setAdminTab] = useState('requests');
  const [notifications, setNotifications] = useState<{id:string;title:string;body:string;date:string;target:string}[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeTarget, setNoticeTarget] = useState('الكل');
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
      destination: item.destination, imageUri: item.imageUri
    }
  });

  const loadSupabaseData = async () => {
    try {
      setLoadingDb(true);
      const { data: vData, error: vError } = await supabase.from('vehicles').select('*').order('car_number');
      if (vError) throw vError;
      const mappedFleet: Vehicle[] = (vData || []).map((v: any) => {
        const carNo = String(v.car_number || '').trim();
        return {
          id: carNo,
          name: v.car_name || `سيارة ${carNo}`,
          driver: '',
          status: 'في الخدمة',
          type: v.brand || 'سيارة',
          model: String(v.manufacturing_year || v.model || ''),
          payload: v.load_capacity || '',
          fuelType: 'ديزل',
          engineNo: v.engine_number || '',
          chassisNo: v.chassis_number || '',
          ownership: 'شركة'
        };
      });
      setFleet(mappedFleet);

      const { data: rData, error: rError } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
      if (rError) throw rError;
      const mappedReqs: RequestItem[] = (rData || []).map((r: any) => {
        const stored = parseStoredNotes(r.notes);
        const extra = stored.appFields || {};
        const stage = r.status === 'مرفوض' || r.status === 'تم رفض الطلب' ? 'تم رفض الطلب'
          : r.status === 'تمت الموافقة' || r.status === 'تم الاعتماد' ? 'تمت الموافقة'
          : (r.direct_manager_status === 'موافق' || r.direct_manager_status === 'تمت الموافقة')
            ? ((r.services_status === 'موافق' || r.services_status === 'تمت الموافقة') ? 'المسؤول' : 'الخدمات الإدارية')
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
          approvalTrail: extra.approvalTrail || [], destination: extra.destination
        };
      });
      setRequests(mappedReqs);
    } catch (e: any) {
      console.log('Supabase Fetch Error:', e?.message || e);
      Alert.alert('تعذر المزامنة', `لم يتم تحميل البيانات من Supabase.\n${e?.message || 'تحقق من الاتصال والصلاحيات.'}`);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadSupabaseData();
  }, [currentUser]);

  const getPermission = (vehicleId: string): PermissionSet =>
    permissions[vehicleId] || DEFAULT_PERMISSIONS;

  const getNextRequestId = () => {
    const nums = requests.map(r => Number(String(r.id).replace(/\D/g, '')) || 0);
    return `REQ-${Math.max(1000, ...nums) + 1}`;
  };

  const lastOdometer = (vehicleId: string) => {
    const rows = requests.filter(r => r.vehicleId === vehicleId && r.type === 'زيوت' && r.currOdo != null);
    return rows.length ? Number(rows[0].currOdo) || 0 : 0;
  };

  const requestTypes = ['وقود', 'زيوت', 'بطاريات', 'قطع غيار', 'صيانة', 'إطارات', 'إرسالية صيانة', 'إرسالية بنشر وخدمات'];
  const [ownershipTypes, setOwnershipTypes] = useState<string[]>(['شركة','خاصة']);
  const codingMap: Record<string, string[]> = {
    'المحروقات': fuelTypes, 'الزيوت': oils, 'البطاريات': batteries, 'قطع الغيار': parts,
    'الإطارات': tires, 'المحطات': stations, 'الصيانة': maintenanceItems,
    'الورش': workshops, 'العملاء': clients, 'المهندسين': engineers, 'مالك السيارة': ownershipTypes,
  };

  const codingSetters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
    'المحروقات': setFuelTypes, 'الزيوت': setOils, 'البطاريات': setBatteries,
    'قطع الغيار': setParts, 'الإطارات': setTires, 'المحطات': setStations,
    'الصيانة': setMaintenanceItems, 'الورش': setWorkshops, 'العملاء': setClients,
    'المهندسين': setEngineers, 'مالك السيارة': setOwnershipTypes,
  };

  const driverNames = useMemo(
    () => Array.from(new Set(fleet.map(v => v.driver).filter(Boolean))),
    [fleet]
  );

  const assignmentVehicle = fleet.find(v => v.id === assignmentForm.vehicleId.trim());

  // دالة تسجيل الدخول المتوافقة مع جداول employees و drivers الخاصة بك
  const handleLogin = async () => {
    const u = username.trim(), p = password.trim();
    if (!u || !p) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المستخدم / رقم الهاتف أو رقم السيارة وكلمة المرور');
      return;
    }
    try {
      setLoadingDb(true);

      // 1. البحث في جدول المسؤولين (employees)
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .or(`username.eq.${u},employee_code.eq.${u}`)
        .eq('password', p)
        .maybeSingle();

      if (empData) {
        setCurrentUser({
          role: 'admin',
          id: empData.employee_code || empData.username,
          name: empData.full_name || empData.username,
          department: empData.department,
          profile: empData
        });
        setUsername(''); setPassword('');
        setLoadingDb(false);
        return;
      }

      // 2. البحث في جدول السائقين (drivers)
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('plate_number', u)
        .maybeSingle();

      if (driverData && p === '000') {
        setCurrentUser({
          role: 'driver',
          id: driverData.plate_number,
          driver: driverData.driver_name,
          name: driverData.driver_name,
          profile: driverData
        });
        setEditDriverName(driverData.driver_name);
        setUsername(''); setPassword('');
        setLoadingDb(false);
        return;
      }

      Alert.alert('تعذر تسجيل الدخول', 'تأكد من صحة اسم المستخدم/رقم السيارة وكلمة المرور.');
    } catch (e: any) {
      Alert.alert('خطأ في تسجيل الدخول', e?.message || 'تعذر الاتصال بقاعدة البيانات.');
    } finally {
      setLoadingDb(false);
    }
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
      id: getNextRequestId(), vehicleId: currentUser.id, driver: currentUser.driver || currentUser.name || '',
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
    } else if (serviceTypeModal === 'إرسالية بنشر وخدمات') {
      if (!selectedClient || !serviceDescription.trim()) { Alert.alert('تنبيه', 'اختر العميل واكتب الخدمة المطلوبة.'); return; }
      item.qty = 1; item.total = 0; item.client = selectedClient; item.serviceDescription = serviceDescription;
    }
    try {
      const { error } = await supabase.from('requests').insert({
        id: item.id, vehicle_id: item.vehicleId,
        driver_name: item.driver, service_type: item.type, request_date: item.date,
        quantity: item.qty, unit: item.unit || null, unit_price: item.qty ? item.total / item.qty : 0,
        total: item.total, station: item.station || null, odometer: item.currOdo ?? null,
        notes: makeStoredNotes(item), status: 'تحت المراجعة',
        direct_manager_status: 'قيد المراجعة', services_status: 'قيد المراجعة',
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setRequests(prev => [item, ...prev]);
      setNotifications(prev => [{id:`NTF-${Date.now()}`,title:'طلب جديد',body:`تم إرسال ${item.type} رقم ${item.id}`,date:TODAY(),target:'المسؤول'}, ...prev]);
      setServiceTypeModal(null); resetRequestForm(); setUserTab('my_requests');
      Alert.alert('تم إرسال الطلب', 'تم حفظ الطلب في قاعدة البيانات بنجاح.');
    } catch (e: any) {
      Alert.alert('تعذر حفظ الطلب', e?.message || 'تحقق من اتصال الإنترنت.');
    }
  };

  const advanceRequest = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    let patch: any = {};
    let updated: RequestItem = { ...req };
    const stage = req.workflow || 'المسؤول المباشر';
    if (stage === 'المسؤول المباشر') {
      patch = { direct_manager_status: 'موافق', status: 'تحت المراجعة' };
      updated = { ...req, workflow: 'الخدمات الإدارية', status: 'تحت المراجعة', approvalTrail:[...(req.approvalTrail||[]),'وافق المسؤول المباشر'] };
    } else if (stage === 'الخدمات الإدارية') {
      patch = { services_status: 'موافق', status: 'تحت المراجعة' };
      updated = { ...req, workflow: 'المسؤول', status: 'تحت المراجعة', approvalTrail:[...(req.approvalTrail||[]),'وافقت الخدمات الإدارية'] };
    } else if (stage === 'المسؤول') {
      patch = { status: 'تمت الموافقة', direct_manager_status: 'موافق', services_status: 'موافق', reviewed_at: new Date().toISOString() };
      updated = { ...req, workflow: 'تمت الموافقة', status: 'تمت الموافقة', approvalTrail:[...(req.approvalTrail||[]),'تمت الموافقة النهائية'] };
    } else return;
    try {
      patch.notes = makeStoredNotes(updated); patch.updated_at = new Date().toISOString();
      const { error } = await supabase.from('requests').update(patch).eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      Alert.alert('تم التحديث', 'تم حفظ قرار الموافقة في قاعدة البيانات.');
    } catch (e: any) { Alert.alert('تعذر تحديث الطلب', e?.message || ''); }
  };

  const rejectRequest = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, workflow: 'تم رفض الطلب', status: 'مرفوض', approvalTrail:[...(req.approvalTrail||[]),`تم رفض الطلب`] };
    try {
      const { error } = await supabase.from('requests').update({
        status: 'مرفوض', rejection_reason: 'تم رفض الطلب',
        reviewed_at: new Date().toISOString(),
        notes: makeStoredNotes(updated), updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      Alert.alert('تم رفض الطلب', 'تم حفظ حالة الرفض في قاعدة البيانات.');
    } catch (e: any) { Alert.alert('تعذر رفض الطلب', e?.message || ''); }
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
    Alert.alert('تأكيد الحذف', 'هل تريد حذف هذا العنصر؟', [
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

  const renderSelect = (label: string, value: string, options: string[], setter: (v: string) => void) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        {options.map(o => (
          <TouchableOpacity key={o} onPress={() => setter(o)} style={[styles.choice, value === o && styles.choiceActive]}>
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
          <View style={styles.menuIcon}><Text style={styles.menuIconText}>{['⛽','🛢️','🔋','🔧','🛞','🏪','🛠️','🏭','👥','👨‍🔧','🚙'][i] || '🧩'}</Text></View>
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
            <Text style={styles.cardText}>التاريخ: {r.date} | القيمة: {money(r.total)}</Text>
            {r.notes ? <Text style={styles.cardText}>الملاحظات: {r.notes}</Text> : null}
            <Text style={styles.workflowTitle}>المرحلة: {r.workflow || 'المسؤول المباشر'}</Text>
            {r.imageUri ? <View><Image source={{uri:r.imageUri}} style={styles.requestImage} /></View> : null}
            {r.status !== 'تمت الموافقة' && r.status !== 'مرفوض' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.success}]} onPress={() => advanceRequest(r.id)}><Text style={styles.btnText}>قبول / إحالة</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.danger}]} onPress={() => rejectRequest(r.id)}><Text style={styles.btnText}>رفض</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderFleet = () => {
    const categories = ['السيارات المفعلة', 'السيارات الموقف', 'جميع السيارات'];
    const filtered = fleet.filter(v => {
      if (fleetCategory === 'السيارات المفعلة') return v.status !== 'موقف';
      if (fleetCategory === 'السيارات الموقف') return v.status === 'موقف';
      return true;
    });
    const openAddVehicle = () => {
      setVehicleEditId(null);
      setVehicleForm({ id: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '', payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة' });
      setVehicleModalVisible(true);
    };
    const saveVehicle = async () => {
      if (!vehicleForm.id.trim() || !vehicleForm.name.trim()) { Alert.alert('تنبيه', 'رقم السيارة واسمها مطلوبان.'); return; }
      const value = { ...vehicleForm, id: vehicleForm.id.trim(), name: vehicleForm.name.trim() };
      const row = { car_number: value.id, car_name: value.name, brand: value.type || null, model: value.model || null, load_capacity: value.payload || null };
      try {
        const result = vehicleEditId ? await supabase.from('vehicles').update(row).eq('car_number', vehicleEditId) : await supabase.from('vehicles').insert(row);
        if (result.error) throw result.error;
        if (vehicleEditId) setFleet(prev => prev.map(v => v.id === vehicleEditId ? value : v));
        else setFleet(prev => [...prev, value]);
        setVehicleModalVisible(false);
        Alert.alert('تم الحفظ', 'تم حفظ السيارة بنجاح.');
      } catch (e: any) { Alert.alert('خطأ', e?.message || ''); }
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
            <View style={styles.cardHeader}><Text style={styles.cardId}>🚗 {v.id}</Text><Text style={styles.badge}>{v.status}</Text></View>
            <Text style={styles.cardTitle}>{v.name}</Text>
            <Text style={styles.cardText}>الموديل: {v.model} | الفئة: {v.type}</Text>
          </View>
        ))}
        <Modal visible={vehicleModalVisible} transparent animationType="slide" onRequestClose={() => setVehicleModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>إضافة / تعديل سيارة</Text>
              <TextInput style={styles.input} placeholder="رقم السيارة" value={vehicleForm.id} onChangeText={v => setVehicleForm(p => ({...p, id: v}))} textAlign="right" />
              <TextInput style={styles.input} placeholder="اسم السيارة" value={vehicleForm.name} onChangeText={v => setVehicleForm(p => ({...p, name: v}))} textAlign="right" />
              <TouchableOpacity style={styles.primaryBtn} onPress={saveVehicle}><Text style={styles.btnText}>حفظ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVehicleModalVisible(false)}><Text style={styles.btnText}>إلغاء</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderAssignments = () => (
    <View>
      <Text style={styles.sectionTitle}>ربط السائقين بالسيارات</Text>
      <TextInput style={styles.input} placeholder="رقم السيارة" value={assignmentForm.vehicleId} onChangeText={v => setAssignmentForm(p => ({...p, vehicleId: v}))} textAlign="right" />
      <TextInput style={styles.input} placeholder="اسم السائق" value={assignmentForm.driver} onChangeText={v => setAssignmentForm(p => ({...p, driver: v}))} textAlign="right" />
      <TouchableOpacity style={styles.primaryBtn} onPress={() => {
        if (!assignmentForm.vehicleId || !assignmentForm.driver) { Alert.alert('تنبيه', 'أدخل رقم السيارة واسم السائق'); return; }
        setAssignments(prev => [...prev, { ...assignmentForm, id: `ASG-${Date.now()}` }]);
        setAssignmentForm({ id:'', driver:'', driverId:'', vehicleId:'', startDate:TODAY(), endDate:'', notes:'' });
        Alert.alert('تم', 'تم ربط السائق بنجاح');
      }}><Text style={styles.btnText}>حفظ التكليف</Text></TouchableOpacity>
      {assignments.map(a => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardId}>{a.id}</Text>
          <Text style={styles.cardText}>السيارة: {a.vehicleId} | السائق: {a.driver}</Text>
        </View>
      ))}
    </View>
  );

  const renderPermissions = () => (
    <View>
      <Text style={styles.sectionTitle}>الصلاحيات</Text>
      {fleet.map(v => {
        const p = getPermission(v.id);
        return (
          <View key={v.id} style={styles.card}>
            <Text style={styles.cardTitle}>سيارة رقم: {v.id}</Text>
            <View style={styles.switchRow}>
              <Switch value={p.requestService} onValueChange={val => setVehiclePermission(v.id, 'requestService', val)} />
              <Text style={styles.switchLabel}>طلب خدمات</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderReports = (isAdmin = false) => {
    let rows = isAdmin ? requests : requests.filter(r => r.vehicleId === currentUser?.id);
    const total = rows.reduce((s, r) => s + Number(r.total || 0), 0);
    return (
      <View>
        <Text style={styles.sectionTitle}>{isAdmin ? 'التقارير العامة' : 'تقارير طلباتي'}</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي المصاريف</Text>
          <Text style={styles.summaryValue}>{money(total)}</Text>
          <Text style={styles.summarySub}>{rows.length} عملية</Text>
        </View>
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
            <Text style={styles.cardTitle}>{r.type}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date} | التكلفة: {money(r.total)}</Text>
          </View>
        ))}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.success }]} onPress={() => exportExcel(rows, 'report')}><Text style={styles.btnText}>Excel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.primary }]} onPress={() => exportPdf(rows, 'تقرير')}><Text style={styles.btnText}>PDF</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>نظام إدارة الأسطول</Text>
          <Text style={styles.loginSubtitle}>{loadingDb ? 'جاري الاتصال بالسحابة...' : `جاهز (${fleet.length} سيارة مسجلة سحابياً)`}</Text>
          <TextInput style={styles.input} placeholder="رقم السيارة / اسم المستخدم (المسؤول)" placeholderTextColor="#94A3B8"
            value={username} onChangeText={setUsername} textAlign="right" />
          <TextInput style={styles.input} placeholder="كلمة المرور (000 للسائقين)" placeholderTextColor="#94A3B8"
            secureTextEntry value={password} onChangeText={setPassword} textAlign="right" />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}><Text style={styles.btnText}>تسجيل الدخول</Text></TouchableOpacity>
          <TouchableOpacity style={styles.reloadBtn} onPress={loadSupabaseData}><Text style={styles.reloadText}>🔄 مزامنة البيانات من السحابة</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (currentUser.role === 'admin') {
    const adminNav = [
      ['requests','📋','الطلبات'], ['coding','🧩','التكويدات'], ['pricing','💰','الأسعار'],
      ['fleet','🚗','السيارات'], ['assignments','🔗','التكليفات'], ['permissions','🔐','الصلاحيات'], ['reports','📊','التقارير'],
    ];
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topHeader}>
          <View><Text style={styles.headerTitle}>لوحة المسؤول</Text><Text style={styles.headerSub}>مرحبًا، {currentUser.name}</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adminNav} contentContainerStyle={{flexDirection:'row-reverse'}}>
          {adminNav.map(([key,icon,label]) => (
            <TouchableOpacity key={key} onPress={() => setAdminTab(key)} style={[styles.adminTab, adminTab === key && styles.adminTabActive]}>
              <Text style={styles.adminIcon}>{icon}</Text>
              <Text style={[styles.adminTabText, adminTab === key && styles.adminTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:110}}>
          {adminTab === 'requests' && renderRequestsAdmin()}
          {adminTab === 'coding' && renderCoding()}
          {adminTab === 'pricing' && renderPricing()}
          {adminTab === 'fleet' && renderFleet()}
          {adminTab === 'assignments' && renderAssignments()}
          {adminTab === 'permissions' && renderPermissions()}
          {adminTab === 'reports' && renderReports(true)}
        </ScrollView>
        <TouchableOpacity style={styles.logoutBar} onPress={handleLogout}><Text style={styles.btnText}>تسجيل الخروج</Text></TouchableOpacity>
        
        <Modal visible={!!codingModal} transparent animationType="slide" onRequestClose={() => setCodingModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>إضافة تكويد لـ {codingModal}</Text>
              <TextInput style={styles.input} value={newItem} onChangeText={setNewItem} placeholder="اسم العنصر الجديد" textAlign="right" />
              <TouchableOpacity style={styles.primaryBtn} onPress={saveCodingItem}><Text style={styles.btnText}>إضافة</Text></TouchableOpacity>
              <ScrollView style={{maxHeight:250, marginVertical:10}}>
                {codingModal && codingMap[codingModal].map((item, index) => (
                  <View key={item} style={styles.inlineRow}>
                    <Text style={{flex:1, textAlign:'right'}}>{item}</Text>
                    <TouchableOpacity onPress={() => deleteCodingItem(codingModal, index)}><Text style={styles.deleteText}>حذف</Text></TouchableOpacity>
                  </View>
                ))}
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
        <View><Text style={styles.headerTitle}>السيارة {currentUser.id}</Text><Text style={styles.headerSub}>{currentUser.driver}</Text></View>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:110}}>
        {userTab === 'service' && (
          <View>
            <Text style={styles.sectionTitle}>الخدمات والطلبات</Text>
            {requestTypes.map((type, index) => (
              <TouchableOpacity key={type} style={styles.serviceCard} onPress={() => openServiceRequest(type)}>
                <View style={styles.serviceIcon}><Text style={{fontSize:25}}>{['⛽','🛢️','🔋','🔧','🛠️','🛞','📦','🧰'][index]}</Text></View>
                <View style={{flex:1}}><Text style={styles.serviceTitle}>طلب {type}</Text><Text style={styles.serviceSub}>إنشاء طلب جديد وإرفاق المستندات</Text></View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {userTab === 'my_requests' && renderReports(false)}
      </ScrollView>
      <View style={styles.driverNav}>
        {[['service','🏠','الرئيسية'], ['my_requests','📊','طلباتي']].map(([key,icon,label]) => (
          <TouchableOpacity key={key} style={styles.driverNavItem} onPress={() => setUserTab(key)}>
            <Text style={{fontSize:18}}>{icon}</Text>
            <Text style={[styles.driverNavText, userTab === key && styles.activeNavText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Modal visible={!!serviceTypeModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setServiceTypeModal(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.topHeader}><Text style={styles.headerTitle}>طلب {serviceTypeModal}</Text><TouchableOpacity onPress={() => setServiceTypeModal(null)}><Text style={{color:'#fff',fontWeight:'900'}}>إغلاق</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            {serviceTypeModal === 'وقود' && <>{renderSelect('المحطة', selectedStation, stations, setSelectedStation)}{renderSelect('نوع الوقود', selectedFuel, fuelTypes, setSelectedFuel)}<Text style={styles.label}>الكمية</Text><TextInput style={styles.input} keyboardType="numeric" value={reqQty} onChangeText={setReqQty} textAlign="right" /></>}
            {serviceTypeModal === 'زيوت' && <>{renderSelect('نوع الزيت', selectedOil, oils, setSelectedOil)}<Text style={styles.label}>الكمية</Text><TextInput style={styles.input} keyboardType="numeric" value={reqQty} onChangeText={setReqQty} textAlign="right" /><Text style={styles.label}>العداد الحالي</Text><TextInput style={styles.input} keyboardType="numeric" value={currOdometer} onChangeText={setCurrOdometer} textAlign="right" /></>}
            {serviceTypeModal === 'بطاريات' && renderSelect('نوع البطارية', selectedBattery, batteries, setSelectedBattery)}
            {serviceTypeModal === 'قطع غيار' && renderSelect('قطعة الغيار', selectedPart, parts, setSelectedPart)}
            {serviceTypeModal === 'إطارات' && renderSelect('نوع الإطار', selectedTire, tires, setSelectedTire)}
            {serviceTypeModal === 'صيانة' && <>{renderSelect('نوع الصيانة', selectedMaintenance, maintenanceItems, setSelectedMaintenance)}<Text style={styles.label}>نوع العطل</Text><TextInput style={styles.input} value={faultType} onChangeText={setFaultType} textAlign="right" /></>}
            
            <Text style={styles.label}>الملاحظات</Text>
            <TextInput style={[styles.input,{minHeight:70}]} value={reqNotes} onChangeText={setReqNotes} multiline textAlign="right" />
            <TouchableOpacity style={styles.secondaryBtn} onPress={openImagePicker}><Text style={styles.btnText}>📷 إرفاق صورة</Text></TouchableOpacity>
            {reqImage ? <Image source={{uri: reqImage}} style={{width:100, height:100, marginVertical:8, alignSelf:'flex-end'}} /> : null}

            <TouchableOpacity style={styles.primaryBtn} onPress={submitRequest}><Text style={styles.btnText}>إرسال الطلب</Text></TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.bg},
  loginContainer:{flex:1,backgroundColor:COLORS.bg,justifyContent:'center',alignItems:'center',padding:20},
  loginCard:{width:'100%',maxWidth:400,backgroundColor:'#fff',borderRadius:24,padding:26,elevation:5},
  loginTitle:{textAlign:'center',fontSize:22,fontWeight:'900',color:COLORS.primary,marginBottom:6},
  loginSubtitle:{textAlign:'center',fontSize:13,color:COLORS.muted,marginBottom:20},
  input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
  primaryBtn:{backgroundColor:COLORS.primary,borderRadius:12,padding:13,alignItems:'center',marginTop:6},
  secondaryBtn:{backgroundColor:COLORS.primaryDark,borderRadius:12,padding:12,alignItems:'center',marginTop:10},
  btnText:{color:'#fff',fontWeight:'800',textAlign:'center'},
  topHeader:{backgroundColor:COLORS.primary,paddingHorizontal:18,paddingVertical:15,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},
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
  modalContent:{backgroundColor:'#fff',borderRadius:20,padding:18,maxHeight:'92%'},
  modalTitle:{textAlign:'right',fontSize:20,fontWeight:'900',color:COLORS.text,marginBottom:12},
  serviceCard:{backgroundColor:'#fff',borderRadius:18,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7'},
  serviceIcon:{width:55,height:55,borderRadius:17,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  serviceTitle:{textAlign:'right',fontWeight:'900',fontSize:16,color:COLORS.text},
  serviceSub:{textAlign:'right',color:COLORS.muted,fontSize:12,marginTop:3},
  driverNav:{flexDirection:'row-reverse',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.border,paddingVertical:7},
  driverNavItem:{flex:1,alignItems:'center',paddingVertical:7},
  driverNavText:{color:'#64748B',fontSize:11,fontWeight:'600'},
  activeNavText:{color:COLORS.primary,fontWeight:'900'},
  workflowTitle:{textAlign:'right',fontWeight:'800',color:COLORS.primary,marginTop:7},
  requestTabs:{backgroundColor:'#fff',borderRadius:12,marginBottom:12,borderWidth:1,borderColor:COLORS.border},
  requestTab:{paddingHorizontal:14,paddingVertical:11,borderBottomWidth:3,borderBottomColor:'transparent'},
  requestTabActive:{borderBottomColor:COLORS.primary,backgroundColor:'#FFF5F5'},
  requestTabText:{color:COLORS.muted,fontWeight:'700',fontSize:12},
  requestTabTextActive:{color:COLORS.primary,fontWeight:'900'},
  emptyCard:{backgroundColor:'#fff',borderRadius:16,padding:22,alignItems:'center',marginBottom:12},
  emptyText:{color:COLORS.muted,fontWeight:'700',textAlign:'center'},
  requestImage:{width:170,height:170,borderRadius:14,alignSelf:'flex-end',marginTop:10},
  reloadBtn:{marginTop:15,padding:10,alignItems:'center'},
  reloadText:{color:'#2563EB',fontSize:13,fontWeight:'800'}
});

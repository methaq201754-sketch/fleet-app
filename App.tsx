import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView, StatusBar, Switch, Image, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const APP_VERSION = '1.28.3';
const APP_BUILD = '39';

const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F4F7FB', card: '#FFFFFF', text: '#263238', muted: '#718096',
  border: '#E2E8F0', success: '#2E7D32', warning: '#ED8B00', danger: '#C62828',
};

type Vehicle = {
  id: string; name: string; driver: string; status: string; type: string;
  model: string; payload: string; fuelType: string; engineNo: string; chassisNo: string;
  ownership?: string;
};

type RequestItem = {
  id: string; vehicleId: string; driver: string; type: string; date: string;
  qty: number; total: number; status: string; notes?: string; imageUri?: string;
  station?: string; fuelType?: string; unit?: string; oilType?: string;
  itemName?: string; prevOdo?: number; currOdo?: number; distance?: number;
  workshop?: string; engineer?: string; faultType?: string; requiredWork?: string;
  client?: string; serviceDescription?: string; workflow?: string;
  routeStage?: string; approvals?: { role: string; status: string }[];
  // حقول طلب الرحلة
  taskType?: string; destination?: string; startDate?: string; tripDuration?: string; returnDate?: string; custody?: string;
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
  { id: '22618', name: 'قاطرة فولفو 2002 رقم 22618', driver: 'عبد الغني علي دحان', status: 'في الخدمة', type: 'شاحنة', model: '2002', payload: '40 طن', fuelType: 'ديزل', engineNo: 'ENG-22618', chassisNo: 'CHS-22618', ownership: 'سيارات الشركة' },
  { id: '36040', name: 'شاحنة فولفو 2013 رقم 36040', driver: 'حافظ عبده محمد النينه', status: 'في الخدمة', type: 'شاحنة', model: '2013', payload: '35 طن', fuelType: 'ديزل', engineNo: 'ENG-36040', chassisNo: 'CHS-36040', ownership: 'سيارات الشركة' },
  { id: '28336', name: 'متسوبيشي فوزو 2012 رقم 28336', driver: 'عبد الله احمد عبد الله', status: 'في الخدمة', type: 'دينا', model: '2012', payload: '7 طن', fuelType: 'ديزل', engineNo: 'ENG-28336', chassisNo: 'CHS-28336', ownership: 'سيارات الشركة' },
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
  const [darkMode, setDarkMode] = useState(false);

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
  const [carOwners, setCarOwners] = useState<string[]>(['سيارات الشركة', 'السيارات الخاصة']);
  const [tripTaskTypes, setTripTaskTypes] = useState<string[]>(['مهمة رسمية', 'نقل بضائع', 'صيانة خارجية']);
  const [destinations, setDestinations] = useState<string[]>(['صنعاء', 'المخا', 'العدين', 'إب']);

  const [prices, setPrices] = useState<Record<string, number>>({
    'ديزل': 1200, 'بترول': 1200, 'تويوتا': 4500, 'ليكوي مولي': 6000,
    'ناشيونال': 4000, 'بطارية 70 أمبير': 65000, 'بطارية 100 أمبير': 85000,
    'فلتر زيت': 8000, 'فلتر هواء': 12000, 'فحمات فرامل': 25000,
    'إطار 12.00R20': 85000, 'إطار 215/75R17.5': 65000,
  });

  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: 'REQ-1001', vehicleId: '22618', driver: 'عبد الغني علي دحان', type: 'وقود',
      date: '2026-10-01', qty: 50, total: 60000, station: 'محطة الشركة',
      fuelType: 'ديزل', status: 'تمت الموافقة', workflow: 'تمت الموافقة',
      approvals: [{ role: 'المسؤول المباشر', status: 'موافق' }, { role: 'الخدمات الإدارية', status: 'موافق' }]
    }
  ]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionSet>>({});
  
  // مسارات الطلبات واعدادات المسؤول المباشر
  const [routeSettings, setRouteSettings] = useState<Record<string, string[]>>({
    'وقود': ['المسؤول المباشر', 'الخدمات الإدارية'],
    'زيوت': ['المسؤول المباشر', 'الخدمات الإدارية'],
    'صيانة': ['المسؤول المباشر', 'الورشة المركزية'],
    'طلب رحلة': ['المسؤول المباشر', 'إدارة الحركة']
  });
  const [directManagers, setDirectManagers] = useState<string[]>(['حمود سرحان', 'عبد الغني علي دحان']);

  const [userTab, setUserTab] = useState('main'); // main, reports, settings, notifications, about
  const [adminTab, setAdminTab] = useState('requests');
  const [adminControlSubTab, setAdminControlSubTab] = useState('routes');
  const [adminRequestSubTab, setAdminRequestSubTab] = useState('وقود');
  const [adminPricingSubTab, setAdminPricingSubTab] = useState('وقود');

  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  const [codingModal, setCodingModal] = useState<string | null>(null);
  const [itemEditor, setItemEditor] = useState({ index: -1, value: '' });
  const [newItem, setNewItem] = useState('');

  // قيم نموذج الطلب الحالي
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
  const [reqImage, setReqImage] = useState<string | undefined>(undefined);
  
  const [faultType, setFaultType] = useState('');
  const [requiredWork, setRequiredWork] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceUserClient, setServiceUserClient] = useState(clients[0]);
  const [serviceUserWorkshop, setServiceUserWorkshop] = useState(workshops[0]);
  const [serviceUserEngineer, setServiceUserEngineer] = useState(engineers[0]);
  
  // حقول طلب الرحلة
  const [tripTaskType, setTripTaskType] = useState(tripTaskTypes[0]);
  const [tripDestination, setTripDestination] = useState(destinations[0]);
  const [tripStartDate, setTripStartDate] = useState(TODAY());
  const [tripDuration, setTripDuration] = useState('1 يوم');
  const [tripReturnDate, setTripReturnDate] = useState(TODAY());
  const [tripCustody, setTripCustody] = useState('');

  // تبويبات داخل نافذة الطلب (شبه طلب إجازة)
  const [requestModalTab, setRequestModalTab] = useState<'create' | 'report'>('create');
  const [userReportFilterStatus, setUserReportFilterStatus] = useState('كل الحالات');

  // إرسال إشعارات عامة من المسؤول
  const [notificationsList, setNotificationsList] = useState<Array<{ id: string; title: string; body: string; date: string; target: string }>>([
    { id: 'notif-1', title: 'تنبيه نظام الأسطول', body: 'تم تحديث أسعار المحروقات والزيوت.', date: TODAY(), target: 'الكل' }
  ]);
  const [adminNotifTitle, setAdminNotifTitle] = useState('');
  const [adminNotifBody, setAdminNotifBody] = useState('');
  const [adminNotifTarget, setAdminNotifTarget] = useState('الكل');

  // تحرير بيانات المستخدم / السائق
  const [editDriverName, setEditDriverName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // إدارة السيارات
  const [fleetCategory, setFleetCategory] = useState('جميع السيارات');
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleEditId, setVehicleEditId] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Vehicle>({
    id: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
    payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'سيارات الشركة'
  });

  // منسدلة السيارات بربط السائقين
  const [vehicleDropdownVisible, setVehicleDropdownVisible] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<Assignment>({
    id: '', driver: '', driverId: '', vehicleId: '', startDate: TODAY(), endDate: '', notes: '',
  });

  const codingMap: Record<string, string[]> = {
    'المحروقات': fuelTypes, 'الزيوت': oils, 'البطاريات': batteries, 'قطع الغيار': parts,
    'الإطارات': tires, 'المحطات': stations, 'الصيانة': maintenanceItems,
    'الورش': workshops, 'العملاء': clients, 'المهندسين': engineers,
    'مالك السيارة': carOwners, 'أنواع المهام للرحلات': tripTaskTypes, 'الوجهات': destinations
  };

  const codingSetters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
    'المحروقات': setFuelTypes, 'الزيوت': setOils, 'البطاريات': setBatteries,
    'قطع الغيار': setParts, 'الإطارات': setTires, 'المحطات': setStations,
    'الصيانة': setMaintenanceItems, 'الورش': setWorkshops, 'العملاء': setClients,
    'المهندسين': setEngineers, 'مالك السيارة': setCarOwners,
    'أنواع المهام للرحلات': setTripTaskTypes, 'الوجهات': setDestinations
  };

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
    setCurrentUser(null); setUserTab('main'); setAdminTab('requests');
  };

  const resetRequestForm = () => {
    setReqQty(''); setCurrOdometer(''); setReqNotes(''); setReqImage(undefined);
    setFaultType(''); setRequiredWork(''); setServiceDescription('');
    setTripCustody('');
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

  const submitRequest = () => {
    if (!currentUser || !serviceTypeModal) return;
    const nextId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const route = routeSettings[serviceTypeModal] || ['المسؤول المباشر'];

    const item: RequestItem = {
      id: nextId, vehicleId: currentUser.id, driver: currentUser.driver,
      type: serviceTypeModal, date: TODAY(), qty: 1, total: 0,
      status: 'تحت المراجعة', workflow: route[0] || 'المسؤول المباشر',
      routeStage: route[0],
      notes: reqNotes, imageUri: reqImage,
      approvals: route.map(r => ({ role: r, status: 'انتظار' }))
    };

    if (serviceTypeModal === 'وقود') {
      const qty = Number(reqQty);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      item.qty = qty; item.total = qty * currentUnitPrice();
      item.station = selectedStation; item.fuelType = selectedFuel;
    } else if (serviceTypeModal === 'زيوت') {
      const qty = Number(reqQty);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      item.qty = qty; item.total = qty * currentUnitPrice(); item.oilType = selectedOil;
    } else if (serviceTypeModal === 'طلب رحلة') {
      item.taskType = tripTaskType;
      item.destination = tripDestination;
      item.startDate = tripStartDate;
      item.tripDuration = tripDuration;
      item.returnDate = tripReturnDate;
      item.custody = tripCustody;
    }
    
    setRequests(prev => [item, ...prev]);
    setServiceTypeModal(null);
    resetRequestForm();
    Alert.alert('تم إرسال الطلب', `تم إرسال طلب ${serviceTypeModal} بنجاح إلى ${route[0]}.`);
  };

  const acceptRequestAdmin = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const currentRoute = routeSettings[r.type] || ['المسؤول المباشر', 'الخدمات الإدارية'];
      const currentIndex = currentRoute.indexOf(r.workflow || currentRoute[0]);
      if (currentIndex < currentRoute.length - 1 && currentIndex !== -1) {
        const nextStage = currentRoute[currentIndex + 1];
        return {
          ...r,
          workflow: nextStage,
          status: 'تحت المراجعة',
          approvals: r.approvals?.map(a => a.role === r.workflow ? { ...a, status: 'موافق' } : a)
        };
      } else {
        return {
          ...r,
          workflow: 'تمت الموافقة',
          status: 'تمت الموافقة',
          approvals: r.approvals?.map(a => ({ ...a, status: 'موافق' }))
        };
      }
    }));
  };

  const rejectRequestAdmin = (id: string) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, workflow: 'مرفوض', status: 'مرفوض' } : r
    ));
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
      <Text style={styles.helper}>إضافة وتعديل وحذف التكويدات (تشمل مالك السيارة، أنواع المهام، الوجهات، وغيرها).</Text>
      {Object.keys(codingMap).map((key, i) => (
        <TouchableOpacity key={key} style={styles.menuCard} onPress={() => setCodingModal(key)}>
          <View style={styles.menuIcon}><Text style={styles.menuIconText}>{['⛽','🛢️','🔋','🔧','🛞','🏪','🛠️','🏭','👥','👨‍🔧','🏢','🚗','📍'][i] || '📁'}</Text></View>
          <View style={{flex:1}}>
            <Text style={styles.menuTitle}>{key}</Text>
            <Text style={styles.menuSub}>{codingMap[key].length} عنصر</Text>
          </View>
          <Text style={styles.chevron}>‹</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAdminControl = () => (
    <View>
      <Text style={styles.sectionTitle}>لوحة التحكم المركزية</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}} contentContainerStyle={{flexDirection:'row-reverse', gap: 6}}>
        {[
          ['routes', 'إعدادات المسارات'],
          ['managers', 'إعدادات المسؤول المباشر'],
          ['passwords', 'إعدادات كلمات المرور'],
          ['notifications', 'إرسال الإشعارات']
        ].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setAdminControlSubTab(key)}
            style={[styles.choice, adminControlSubTab === key && styles.choiceActive]}>
            <Text style={[styles.choiceText, adminControlSubTab === key && styles.choiceTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {adminControlSubTab === 'routes' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>إعدادات مسارات الطلبات</Text>
          <Text style={styles.helper}>تحديد تسلسل الاعتمادات لكل نوع طلب (المسؤول المباشر، الخدمات الإدارية، إلخ).</Text>
          {Object.keys(routeSettings).map(reqType => (
            <View key={reqType} style={{marginVertical: 6}}>
              <Text style={styles.label}>{reqType}:</Text>
              <TextInput
                style={styles.input}
                value={routeSettings[reqType].join(' -> ')}
                onChangeText={v => setRouteSettings(p => ({ ...p, [reqType]: v.split('->').map(s => s.trim()) }))}
                textAlign="right"
              />
            </View>
          ))}
        </View>
      )}

      {adminControlSubTab === 'managers' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>إعدادات المسؤول المباشر</Text>
          <Text style={styles.helper}>تحديد السائقين الذين يعملون كمسؤولين مباشرين للاعتماد.</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل اسم المسؤول المباشر الجديد"
            onSubmitEditing={e => {
              if (e.nativeEvent.text.trim()) {
                setDirectManagers(prev => [...prev, e.nativeEvent.text.trim()]);
              }
            }}
            textAlign="right"
          />
          <View style={{marginTop: 8}}>
            {directManagers.map((m, idx) => (
              <View key={idx} style={styles.inlineRow}>
                <Text style={{flex: 1, textAlign: 'right'}}>{m}</Text>
                <TouchableOpacity onPress={() => setDirectManagers(prev => prev.filter((_, i) => i !== idx))}>
                  <Text style={styles.deleteText}>حذف</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {adminControlSubTab === 'passwords' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>إعدادات كلمات المرور للحسابات</Text>
          <Text style={styles.helper}>تعديل كلمة المرور لأي سيارة أو حساب في الأسطول.</Text>
          {fleet.map(v => (
            <View key={v.id} style={styles.inlineRow}>
              <Text style={{flex: 1, textAlign: 'right'}}>{v.id} - {v.driver}</Text>
              <TouchableOpacity style={styles.smallPrimary} onPress={() => Alert.alert('تم التعديل', `تم إعادة تعيين كلمة مرور السيارة ${v.id} إلى 000`)}>
                <Text style={styles.btnText}>إعادة تعيين 000</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {adminControlSubTab === 'notifications' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>إرسال إشعارات فورية للسائقين</Text>
          <Text style={styles.helper}>إرسال تنبيهات نصية أو صور أو ملفات لجميع السائقين أو سيارة محددة.</Text>
          <TextInput style={styles.input} placeholder="عنوان الإشعار" value={adminNotifTitle} onChangeText={setAdminNotifTitle} textAlign="right" />
          <TextInput style={[styles.input, {minHeight: 60}]} placeholder="نص الإشعار..." value={adminNotifBody} onChangeText={setAdminNotifBody} multiline textAlign="right" />
          {renderSelect('الجهة المستهدفة', adminNotifTarget, ['الكل', ...fleet.map(v => v.id)], setAdminNotifTarget)}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => {
            if (!adminNotifTitle.trim()) return;
            setNotificationsList(prev => [{ id: `notif-${Date.now()}`, title: adminNotifTitle, body: adminNotifBody, date: TODAY(), target: adminNotifTarget }, ...prev]);
            setAdminNotifTitle(''); setAdminNotifBody('');
            Alert.alert('تم الإرسال', 'تم ارسال الإشعار الفوري بنجاح.');
          }}>
            <Text style={styles.btnText}>إرسال الإشعار الآن</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRequestsAdmin = () => {
    const reqSubTabs = ['وقود', 'زيوت', 'قطع غيار', 'صيانة', 'إطارات', 'بطاريات', 'طلب رحلة', 'إرسالية صيانة'];
    const rows = requests.filter(r => r.type === adminRequestSubTab);

    return (
      <View>
        <Text style={styles.sectionTitle}>إدارة الطلبات</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}} contentContainerStyle={{flexDirection:'row-reverse', gap: 6}}>
          {reqSubTabs.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setAdminRequestSubTab(tab)}
              style={[styles.choice, adminRequestSubTab === tab && styles.choiceActive]}>
              <Text style={[styles.choiceText, adminRequestSubTab === tab && styles.choiceTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {rows.length === 0 ? (
          <Text style={[styles.helper, {textAlign: 'center', marginTop: 20}]}>لا توجد طلبات في هذا القسم حالياً.</Text>
        ) : (
          rows.map(r => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardId}>{r.id}</Text>
                <Text style={styles.badge}>{r.status}</Text>
              </View>
              <Text style={styles.cardTitle}>{r.type} - السيارة: {r.vehicleId}</Text>
              <Text style={styles.cardText}>السائق: {r.driver}</Text>
              <Text style={styles.cardText}>التاريخ: {r.date} {r.qty ? `| الكمية: ${r.qty}` : ''}</Text>
              {r.total ? <Text style={styles.cardText}>القيمة: {money(r.total)}</Text> : null}
              {r.destination ? <Text style={styles.cardText}>الوجهة: {r.destination} | نوع المهمة: {r.taskType}</Text> : null}
              {r.notes ? <Text style={styles.cardText}>ملاحظات: {r.notes}</Text> : null}
              {r.imageUri ? <Image source={{ uri: r.imageUri }} style={styles.previewImage} /> : null}
              <Text style={styles.workflowTitle}>المرحلة الحالية: {r.workflow || 'تحت المراجعة'}</Text>
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={() => acceptRequestAdmin(r.id)}>
                  <Text style={styles.btnText}>قبول واعتماد</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger }]} onPress={() => rejectRequestAdmin(r.id)}>
                  <Text style={styles.btnText}>رفض</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderFleet = () => {
    const categories = ['جميع السيارات', 'سيارات الشركة', 'السيارات الخاصة', 'السيارات المفعلة', 'السيارات الموقف'];
    const filtered = fleet.filter(v => {
      const own = v.ownership || 'سيارات الشركة';
      if (fleetCategory === 'سيارات الشركة') return own === 'سيارات الشركة';
      if (fleetCategory === 'السيارات الخاصة') return own === 'السيارات الخاصة';
      if (fleetCategory === 'السيارات المفعلة') return v.status !== 'موقف';
      if (fleetCategory === 'السيارات الموقف') return v.status === 'موقف';
      return true;
    });

    const openAddVehicle = () => {
      setVehicleEditId(null);
      setVehicleForm({
        id: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
        payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'سيارات الشركة'
      });
      setVehicleModalVisible(true);
    };

    const openEditVehicle = (v: Vehicle) => {
      setVehicleEditId(v.id);
      setVehicleForm({ ...v, ownership: v.ownership || 'سيارات الشركة' });
      setVehicleModalVisible(true);
    };

    const saveVehicle = () => {
      if (!vehicleForm.id.trim() || !vehicleForm.name.trim()) {
        Alert.alert('تنبيه', 'رقم السيارة واسم السيارة حقول مطلوبة.');
        return;
      }
      const value = { ...vehicleForm, id: vehicleForm.id.trim(), name: vehicleForm.name.trim() };
      if (vehicleEditId) {
        setFleet(prev => prev.map(v => v.id === vehicleEditId ? value : v));
      } else {
        setFleet(prev => [...prev, value]);
      }
      setVehicleModalVisible(false);
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
            <Text style={styles.cardText}>المالك: {v.ownership || 'سيارات الشركة'}</Text>
            <Text style={styles.cardText}>الموديل: {v.model} | السعة: {v.payload}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => openEditVehicle(v)}>
                <Text style={styles.btnText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: v.status === 'موقف' ? COLORS.success : COLORS.danger }]}
                onPress={() => setFleet(prev => prev.map(x => x.id === v.id ? { ...x, status: x.status === 'موقف' ? 'في الخدمة' : 'موقف' } : x))}>
                <Text style={styles.btnText}>{v.status === 'موقف' ? 'تفعيل' : 'إيقاف'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Modal visible={vehicleModalVisible} transparent animationType="slide" onRequestClose={() => setVehicleModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalCenter}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{vehicleEditId ? 'تعديل سيارة' : 'إضافة سيارة'}</Text>
                {[
                  ['id','رقم السيارة'], ['name','اسم السيارة'], ['driver','السائق'], ['type','فئة النقل'],
                  ['model','الموديل'], ['payload','الحمولة / السعة']
                ].map(([key,label]) => (
                  <View key={key}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput style={styles.input}
                      value={String((vehicleForm as any)[key] || '')}
                      onChangeText={val => setVehicleForm(p => ({ ...p, [key]: val }))}
                      textAlign="right"
                    />
                  </View>
                ))}
                {renderSelect('مالك السيارة', vehicleForm.ownership || 'سيارات الشركة', carOwners, val => setVehicleForm(p => ({ ...p, ownership: val })))}
                {renderSelect('الحالة', vehicleForm.status, ['في الخدمة','موقف'], val => setVehicleForm(p => ({ ...p, status: val })))}
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
      <Text style={styles.helper}>انقر داخل حقل رقم السيارة لتظهر لك قائمة السيارات المتاحة فوراً.</Text>
      
      <Text style={styles.label}>رقم السيارة</Text>
      <TouchableOpacity style={styles.dropdownInput} onPress={() => setVehicleDropdownVisible(true)}>
        <Text style={{ textAlign: 'right', color: assignmentForm.vehicleId ? COLORS.text : COLORS.muted }}>
          {assignmentForm.vehicleId ? `سيارة رقم: ${assignmentForm.vehicleId}` : 'انقر لاختيار رقم السيارة من القائمة'}
        </Text>
      </TouchableOpacity>

      {vehicleDropdownVisible && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>اختر السيارة:</Text>
          {fleet.map(v => (
            <TouchableOpacity key={v.id} style={{paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEF2F7'}}
              onPress={() => { setAssignmentForm(p => ({ ...p, vehicleId: v.id, driver: v.driver })); setVehicleDropdownVisible(false); }}>
              <Text style={{textAlign: 'right', fontWeight: 'bold'}}>{v.id} - {v.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.secondaryBtn, {marginTop: 8}]} onPress={() => setVehicleDropdownVisible(false)}>
            <Text style={styles.btnText}>إغلاق القائمة</Text>
          </TouchableOpacity>
        </View>
      )}

      {assignmentVehicle && (
        <View style={styles.vehicleInfoBox}>
          <Text style={styles.cardTitle}>بيانات السيارة المختارة</Text>
          <Text style={styles.cardText}>الاسم: {assignmentVehicle.name}</Text>
          <Text style={styles.cardText}>السائق الحالي: {assignmentVehicle.driver}</Text>
        </View>
      )}

      <Text style={styles.label}>رقم السائق</Text>
      <TextInput style={styles.input} value={assignmentForm.driverId}
        onChangeText={v => setAssignmentForm(p => ({ ...p, driverId: v }))}
        placeholder="أدخل رقم السائق" textAlign="right" />
      <Text style={styles.label}>اسم السائق</Text>
      <TextInput style={styles.input} value={assignmentForm.driver}
        onChangeText={v => setAssignmentForm(p => ({ ...p, driver: v }))}
        placeholder="اسم السائق المرتبط" textAlign="right" />

      <TouchableOpacity style={styles.primaryBtn} onPress={() => {
        if (!assignmentForm.vehicleId) { Alert.alert('تنبيه', 'يرجى اختيار رقم السيارة.'); return; }
        setAssignments(prev => [...prev, { ...assignmentForm, id: `ASG-${Date.now()}` }]);
        Alert.alert('تم الحفظ', 'تم ربط السائق بالسيارة بنجاح.');
      }}>
        <Text style={styles.btnText}>حفظ التكليف</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPermissions = () => {
    const permissionLabels: Array<[keyof PermissionSet, string]> = [
      ['addVehicle','إضافة سيارة'], ['editVehicle','تعديل بيانات سيارة'],
      ['assignVehicle','ربط السائقين بالسيارات'], ['addDriver','إضافة سائق'],
      ['reports','التقارير'], ['requestService','طلبات الخدمات'],
    ];
    return (
      <View>
        <Text style={styles.sectionTitle}>الصلاحيات</Text>
        {fleet.map(v => {
          const p = permissions[v.id] || DEFAULT_PERMISSIONS;
          return (
            <View key={v.id} style={styles.card}>
              <Text style={styles.cardTitle}>{v.id} - {v.driver}</Text>
              {permissionLabels.map(([key,label]) => (
                <View key={String(key)} style={styles.switchRow}>
                  <Switch value={!!p[key]} onValueChange={value => setPermissions(prev => ({ ...prev, [v.id]: { ...p, [key]: value } }))} />
                  <Text style={styles.switchLabel}>{label}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderReportsAdmin = () => {
    const rows = requests;
    const total = rows.reduce((s, r) => s + Number(r.total || 0), 0);
    return (
      <View>
        <Text style={styles.sectionTitle}>تقارير الأسطول الشاملة</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي المصاريف العامة</Text>
          <Text style={styles.summaryValue}>{money(total)}</Text>
          <Text style={styles.summarySub}>{rows.length} عملية مسجلة</Text>
        </View>
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>{r.id}</Text>
              <Text style={styles.badge}>{r.status}</Text>
            </View>
            <Text style={styles.cardTitle}>{r.type} - سيارة {r.vehicleId}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date} | التكلفة: {money(r.total)}</Text>
            <Text style={styles.workflowTitle}>المرحلة: {r.workflow}</Text>
          </View>
        ))}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.success }]} onPress={() => exportExcel(rows, 'admin-report')}>
            <Text style={styles.btnText}>تصدير Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.primary }]} onPress={() => exportPdf(rows, 'التقرير العام للأسطول')}>
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
    const userReqs = requests.filter(r => r.vehicleId === currentUser?.id && r.type === serviceTypeModal);
    const filteredUserReqs = userReqs.filter(r => userReportFilterStatus === 'كل الحالات' || r.status === userReportFilterStatus);

    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => setServiceTypeModal(null)}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={{flex: 1, justifyContent: 'center', width: '100%'}}>
            <ScrollView contentContainerStyle={styles.modalCenter} keyboardShouldPersistTaps="handled">
              <View style={[styles.modalContent, {maxHeight: '90%'}]}>
                
                {/* تبويبات شبيهة بطلب إجازة */}
                <View style={styles.modalTabHeader}>
                  <TouchableOpacity onPress={() => setRequestModalTab('report')}
                    style={[styles.modalTabBtn, requestModalTab === 'report' && styles.modalTabBtnActive]}>
                    <Text style={[styles.modalTabText, requestModalTab === 'report' && styles.modalTabTextActive]}>تقرير {serviceTypeModal}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRequestModalTab('create')}
                    style={[styles.modalTabBtn, requestModalTab === 'create' && styles.modalTabBtnActive]}>
                    <Text style={[styles.modalTabText, requestModalTab === 'create' && styles.modalTabTextActive]}>طلب {serviceTypeModal}</Text>
                  </TouchableOpacity>
                </View>

                {requestModalTab === 'create' ? (
                  <View style={{paddingVertical: 6}}>
                    <View style={styles.infoPill}>
                      <Text style={styles.infoPillText}>العملية: تلقائية</Text>
                      <Text style={styles.infoPillText}>التاريخ: {TODAY()}</Text>
                    </View>

                    {serviceTypeModal === 'وقود' && <>
                      {renderSelect('المحطة', selectedStation, stations, setSelectedStation)}
                      {renderSelect('نوع الوقود', selectedFuel, fuelTypes, setSelectedFuel)}
                    </>}

                    {serviceTypeModal === 'زيوت' && <>
                      {renderSelect('نوع الزيت', selectedOil, oils, setSelectedOil)}
                      {renderSelect('الوحدة', selectedUnit, ['دبة','علبة','جالون'], setSelectedUnit)}
                    </>}

                    {serviceTypeModal === 'طلب رحلة' && <>
                      {renderSelect('نوع المهمة', tripTaskType, tripTaskTypes, setTripTaskType)}
                      {renderSelect('الوجهة / المنطقة', tripDestination, destinations, setTripDestination)}
                      <Text style={styles.label}>تاريخ الإنطلاق</Text>
                      <TextInput style={styles.input} value={tripStartDate} onChangeText={setTripStartDate} textAlign="right" />
                      <Text style={styles.label}>مدة الرحلة</Text>
                      <TextInput style={styles.input} value={tripDuration} onChangeText={setTripDuration} textAlign="right" />
                      <Text style={styles.label}>تاريخ العودة</Text>
                      <TextInput style={styles.input} value={tripReturnDate} onChangeText={setTripReturnDate} textAlign="right" />
                      <Text style={styles.label}>العهدة المالية</Text>
                      <TextInput style={styles.input} keyboardType="numeric" value={tripCustody} onChangeText={setTripCustody} placeholder="المبلغ المطلوب عهدة" textAlign="right" />
                    </>}

                    {serviceTypeModal !== 'طلب رحلة' && (
                      <>
                        <Text style={styles.label}>الكمية</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={reqQty} onChangeText={setReqQty} placeholder="أدخل الكمية" textAlign="right" />
                        {price > 0 && <Text style={styles.totalText}>الإجمالي التقديري: {money(qty * price)}</Text>}
                      </>
                    )}

                    <Text style={styles.label}>الملاحظات والأسباب</Text>
                    <TextInput style={[styles.input,{minHeight:50}]} value={reqNotes} onChangeText={setReqNotes} multiline textAlign="right" />

                    <View style={styles.attachmentBox}>
                      <Text style={styles.label}>المرفقات</Text>
                      <Text style={styles.helper}>يمكنك إرفاق الصور والمستندات المتعلقة بالطلب</Text>
                      <TouchableOpacity style={styles.uploadBtn} onPress={openImagePicker}>
                        <Text style={styles.uploadBtnText}>＋ إرفاق صورة</Text>
                      </TouchableOpacity>
                      {reqImage ? <Image source={{ uri: reqImage }} style={styles.previewImage} /> : null}
                    </View>

                    <View style={[styles.actionRow, {marginTop: 15}]}>
                      <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.primary}]} onPress={submitRequest}>
                        <Text style={styles.btnText}>إرسال الطلب</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn,{backgroundColor:'#64748B'}]} onPress={() => { setServiceTypeModal(null); resetRequestForm(); }}>
                        <Text style={styles.btnText}>إلغاء</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{paddingVertical: 6}}>
                    {renderSelect('فلترة بالحالة', userReportFilterStatus, ['كل الحالات', 'تحت المراجعة', 'تمت الموافقة', 'مرفوض'], setUserReportFilterStatus)}
                    
                    {filteredUserReqs.length === 0 ? (
                      <Text style={[styles.helper, {textAlign: 'center', marginTop: 20}]}>لا توجد طلبات مسجلة مطابقة.</Text>
                    ) : (
                      filteredUserReqs.map(r => (
                        <View key={r.id} style={styles.card}>
                          <View style={styles.cardHeader}>
                            <Text style={styles.cardId}>{r.id}</Text>
                            <Text style={styles.badge}>{r.status}</Text>
                          </View>
                          <Text style={styles.cardTitle}>{r.type} - {r.date}</Text>
                          {r.total ? <Text style={styles.cardText}>التكلفة: {money(r.total)}</Text> : null}
                          <Text style={styles.workflowTitle}>مسار الطلب والموافقات:</Text>
                          {r.approvals?.map((app, idx) => (
                            <View key={idx} style={{flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 3}}>
                              <Text style={styles.cardText}>- {app.role}</Text>
                              <Text style={{color: app.status === 'موافق' ? COLORS.success : COLORS.muted, fontWeight: 'bold'}}>{app.status}</Text>
                            </View>
                          ))}
                          {r.imageUri ? <Image source={{ uri: r.imageUri }} style={styles.previewImage} /> : null}
                        </View>
                      ))
                    )}

                    <TouchableOpacity style={[styles.secondaryBtn, {marginTop: 15}]} onPress={() => setServiceTypeModal(null)}>
                      <Text style={styles.btnText}>إغلاق التقرير</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginSubtitle}>تسجيل الدخول - نظام الأسطول</Text>
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
      ['requests','📋','الطلبات'], ['control','⚙️','لوحة التحكم'], ['coding','🧩','التكويدات'],
      ['pricing','💰','الأسعار'], ['fleet','🚗','السيارات'], ['assignments','🔗','ربط السائقين'],
      ['permissions','🔐','الصلاحيات'], ['reports','📊','التقارير']
    ];
    return (
      <SafeAreaView style={[styles.container, darkMode && {backgroundColor: '#1E293B'}]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerTitle}>لوحة المسؤول الشاملة</Text>
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
        <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:30}}>
          {adminTab === 'requests' ? renderRequestsAdmin() : null}
          {adminTab === 'control' ? renderAdminControl() : null}
          {adminTab === 'coding' ? renderCoding() : null}
          {adminTab === 'pricing' ? (
            <View>
              <Text style={styles.sectionTitle}>نوافذ التسعير</Text>
              {['وقود', 'زيوت', 'قطع غيار', 'بطاريات', 'إطارات'].map(tab => (
                <View key={tab} style={styles.card}>
                  <Text style={styles.cardTitle}>{tab}</Text>
                  {fuelTypes.map(item => (
                    <View key={item} style={styles.priceRow}>
                      <Text style={styles.cardText}>{item}</Text>
                      <TextInput style={styles.priceInput} keyboardType="numeric" value={String(prices[item] || 0)}
                        onChangeText={v => setPrices(p => ({ ...p, [item]: Number(v.replace(/\D/g, '')) || 0 }))} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
          {adminTab === 'fleet' ? renderFleet() : null}
          {adminTab === 'assignments' ? renderAssignments() : null}
          {adminTab === 'permissions' ? renderPermissions() : null}
          {adminTab === 'reports' ? renderReportsAdmin() : null}
        </ScrollView>
        <TouchableOpacity style={styles.logoutBar} onPress={handleLogout}><Text style={styles.btnText}>تسجيل الخروج</Text></TouchableOpacity>

        <Modal visible={!!codingModal} transparent animationType="slide" onRequestClose={() => setCodingModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>تكويد {codingModal}</Text>
              <TextInput style={styles.input} value={newItem} onChangeText={setNewItem} placeholder="اسم العنصر الجديد" textAlign="right" />
              <TouchableOpacity style={styles.primaryBtn} onPress={saveCodingItem}>
                <Text style={styles.btnText}>إضافة العنصر</Text>
              </TouchableOpacity>
              <ScrollView style={{maxHeight:250, marginTop: 10}}>
                {codingModal ? codingMap[codingModal].map((item, index) => (
                  <View key={index} style={styles.inlineRow}>
                    <Text style={{flex:1, textAlign:'right'}}>{item}</Text>
                    <TouchableOpacity onPress={() => deleteCodingItem(codingModal, index)}>
                      <Text style={styles.deleteText}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                )) : null}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setCodingModal(null); setNewItem(''); }}>
                <Text style={styles.btnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // حساب السائق / المستخدم
  const serviceTypes = ['وقود', 'زيوت', 'طلب رحلة', 'بطاريات', 'قطع غيار', 'صيانة', 'إطارات', 'إرسالية صيانة', 'إرسالية بنشر وخدمات'];

  return (
    <SafeAreaView style={[styles.container, darkMode && {backgroundColor: '#1E293B'}]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>السيارة {currentUser.id}</Text>
          <Text style={styles.headerSub}>{currentUser.driver}</Text>
        </View>
        <View style={styles.headerAvatar}><Text style={{fontSize:22}}>🚗</Text></View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:40}}>
        {userTab === 'main' && (
          <View>
            <Text style={styles.sectionTitle}>الخدمات والطلبات</Text>
            {serviceTypes.map((type, index) => (
              <TouchableOpacity key={type} style={styles.serviceCard} onPress={() => { resetRequestForm(); setServiceTypeModal(type); }}>
                <View style={styles.serviceIcon}><Text style={{fontSize:22}}>{['⛽','🛢️','✈️','🔋','🔧','🛠️','🛞','📦','🧰'][index] || '📋'}</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.serviceTitle}>طلب {type}</Text>
                  <Text style={styles.serviceSub}>إنشاء طلب جديد ومتابعة المراحل والمرفقات</Text>
                </View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitle, {marginTop: 20}]}>تقارير الرحلات</Text>
            <TouchableOpacity style={styles.serviceCard} onPress={() => setUserTab('reports')}>
              <View style={styles.serviceIcon}><Text style={{fontSize:22}}>📊</Text></View>
              <View style={{flex:1}}>
                <Text style={styles.serviceTitle}>تقارير رحلات ومصاريف السيارة</Text>
                <Text style={styles.serviceSub}>عرض تفصيلي وإجمالي حسب التاريخ والنوع</Text>
              </View>
              <Text style={styles.chevron}>‹</Text>
            </TouchableOpacity>
          </View>
        )}

        {userTab === 'notifications' && (
          <View>
            <Text style={styles.sectionTitle}>الإشعارات والتنبيهات</Text>
            {notificationsList.map(n => (
              <View key={n.id} style={styles.card}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.cardText}>{n.body}</Text>
                <Text style={[styles.helper, {textAlign: 'left', marginTop: 4}]}>{n.date}</Text>
              </View>
            ))}
          </View>
        )}

        {userTab === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>تقارير السيارة (إجمالي وتفصيلي)</Text>
            {renderReportsAdmin()}
            <TouchableOpacity style={[styles.secondaryBtn, {marginTop: 15}]} onPress={() => setUserTab('main')}>
              <Text style={styles.btnText}>العودة للرئيسية</Text>
            </TouchableOpacity>
          </View>
        )}

        {userTab === 'settings' && (
          <View>
            <Text style={styles.sectionTitle}>الإعدادات</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Switch value={darkMode} onValueChange={setDarkMode} />
                <Text style={styles.switchLabel}>الوضع الداكن</Text>
              </View>
              <View style={styles.infoRow}><Text style={styles.cardText}>بيانات السائق: {currentUser.driver}</Text></View>
              <View style={styles.infoRow}><Text style={styles.cardText}>رقم السيارة: {currentUser.id}</Text></View>
              <Text style={styles.label}>تغيير كلمة المرور</Text>
              <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="كلمة المرور الجديدة" textAlign="right" />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert('تم الحفظ', 'تم تحديث كلمة المرور.')}>
                <Text style={styles.btnText}>حفظ التغييرات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logoutBar, {marginTop: 15, borderRadius: 12}]} onPress={handleLogout}>
                <Text style={styles.btnText}>تسجيل الخروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {userTab === 'about' && (
          <View style={[styles.card, {alignItems: 'center', paddingVertical: 30}]}>
            <View style={styles.headerAvatar}><Text style={{fontSize: 28}}>YCPD</Text></View>
            <Text style={[styles.sectionTitle, {marginTop: 15}]}>الشركة اليمنية لصناعة الطلاء</Text>
            <Text style={styles.cardText}>نظام إدارة الأسطول الذكي - إصدار {APP_VERSION}</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://github.com')} style={{marginTop: 15}}>
              <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>زيارة موقع الشركة / الدعم الفني</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* الشريط السفلي المحدث حسب الطلب */}
      <View style={styles.driverNav}>
        {[
          ['about', 'عنا', '🏢'],
          ['notifications', 'الإشعارات', '🔔'],
          ['main', 'الرئيسية', '🏠'],
          ['settings', 'الإعدادات', '⚙️']
        ].map(([key, label, icon]) => (
          <TouchableOpacity key={key} style={styles.driverNavItem} onPress={() => setUserTab(key)}>
            <Text style={{fontSize: 18}}>{icon}</Text>
            <Text style={[styles.driverNavText, userTab === key && styles.activeNavText]}>{label}</Text>
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
  card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:11,borderWidth:1,borderColor:'#EEF2F7',elevation:1},
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
  infoRow:{textAlign:'right',paddingVertical:9,borderBottomWidth:1,borderBottomColor:'#EEF2F7',color:'#334155'},
  workflowTitle:{textAlign:'right',fontWeight:'800',color:COLORS.primary,marginTop:7},
  vehicleInfoBox:{backgroundColor:'#F8FAFC',borderRadius:14,padding:12,marginBottom:10,borderWidth:1,borderColor:COLORS.border},
  dropdownInput:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:13,marginBottom:10},
  modalTabHeader:{flexDirection:'row-reverse',borderBottomWidth:1,borderBottomColor:COLORS.border,marginBottom:10},
  modalTabBtn:{flex:1,paddingVertical:10,alignItems:'center',borderBottomWidth:3,borderBottomColor:'transparent'},
  modalTabBtnActive:{borderBottomColor:COLORS.primary},
  modalTabText:{fontWeight:'bold',color:COLORS.muted},
  modalTabTextActive:{color:COLORS.primary},
  attachmentBox:{backgroundColor:'#F8FAFC',borderRadius:12,padding:10,marginTop:8,borderWidth:1,borderColor:COLORS.border},
  uploadBtn:{backgroundColor:'#FFF0F1',borderWidth:1,borderColor:COLORS.primary,borderRadius:10,padding:10,alignItems:'center'}
});

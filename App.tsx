import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  FlatList,
  Switch
} from 'react-native';

// --- Types & Interfaces ---
type Role = 'user' | 'admin';

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  driverName: string;
  type: string;
  capacity: string;
  transportType: string;
  model: string;
  passengers: string;
  fuelType: string;
  status: 'في الخدمة' | 'موقف';
}

interface ServiceRequest {
  id: string;
  type: 'وقود' | 'زيوت' | 'إطارات' | 'بطاريات' | 'صيانة وقطع غيار';
  processNumber: string;
  date: string;
  quantity: string;
  allocation: string;
  station?: string;
  amount?: string;
  status: 'قيد المراجعة' | 'مرفوض' | 'تم الاعتماد';
  notes?: string;
  vehicleId: string;
  driverName: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
}

interface UserPermissions {
  requestFuel: boolean;
  requestOil: boolean;
  requestTires: boolean;
  requestBatteries: boolean;
  requestMaintenance: boolean;
  viewReports: boolean;
}

export default function App() {
  // --- States ---
  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('requests_status');
  const [userPassword, setUserPassword] = useState<string>('123456');

  // Sample Vehicle for User
  const [userVehicle, setUserVehicle] = useState<Vehicle>({
    id: 'v1',
    name: 'شاحنة نقل جاف',
    plateNumber: '1234-أ',
    driverName: 'ميثاق عبده علي مقبل',
    type: 'شاحنة كبيرة',
    capacity: '15 طن',
    transportType: 'بضائع',
    model: '2022',
    passengers: '2',
    fuelType: 'ديزل',
    status: 'في الخدمة'
  });

  // Admin Data Stores
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'v1',
      name: 'شاحنة نقل جاف',
      plateNumber: '1234-أ',
      driverName: 'ميثاق عبده علي مقبل',
      type: 'شاحنة كبيرة',
      capacity: '15 طن',
      transportType: 'بضائع',
      model: '2022',
      passengers: '2',
      fuelType: 'ديزل',
      status: 'في الخدمة'
    },
    {
      id: 'v2',
      name: 'دينا توزيع',
      plateNumber: '5678-ب',
      driverName: 'أحمد علي',
      type: 'متوسطة',
      capacity: '5 طن',
      transportType: 'توزيع محلي',
      model: '2020',
      passengers: '3',
      fuelType: 'بنزين',
      status: 'في الخدمة'
    }
  ]);

  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 'd1', name: 'ميثاق عبده علي مقبل', phone: '770000000', licenseNumber: 'L-1022' },
    { id: 'd2', name: 'أحمد علي', phone: '771111111', licenseNumber: 'L-5044' }
  ]);

  const [permissions, setPermissions] = useState<UserPermissions>({
    requestFuel: true,
    requestOil: true,
    requestTires: true,
    requestBatteries: true,
    requestMaintenance: true,
    viewReports: true
  });

  const [requests, setRequests] = useState<ServiceRequest[]>([
    {
      id: 'req-1',
      type: 'وقود',
      processNumber: 'TRX-1001',
      date: new Date().toISOString().split('T')[0],
      quantity: '100',
      allocation: 'رحلة تعز - عدن',
      station: 'محطة أطلس المركزية',
      amount: '50000',
      status: 'تم الاعتماد',
      vehicleId: 'v1',
      driverName: 'ميثاق عبده علي مقبل'
    },
    {
      id: 'req-2',
      type: 'وقود',
      processNumber: 'TRX-1002',
      date: new Date().toISOString().split('T')[0],
      quantity: '80',
      allocation: 'تشغيل داخلي',
      station: 'محطة الصداقة',
      amount: '40000',
      status: 'قيد المراجعة',
      vehicleId: 'v1',
      driverName: 'ميثاق عبده علي مقبل'
    }
  ]);

  // Form States
  const [newReqType, setNewReqType] = useState<any>('وقود');
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');

  // Password & Settings States
  const [editName, setEditName] = useState(userVehicle.name);
  const [editPlate, setEditPlate] = useState(userVehicle.plateNumber);
  const [editDriver, setEditDriver] = useState(userVehicle.driverName);
  const [newPass, setNewPass] = useState('');

  // Vehicle Management States
  const [selectedVehicleForStatus, setSelectedVehicleForStatus] = useState<string>('v1');

  // Modals
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverNameInput, setDriverNameInput] = useState('');

  // --- Handlers ---
  const handleCreateRequest = () => {
    if (userVehicle.status === 'موقف') {
      Alert.alert('تنبيه', 'السيارة متوقفة حالياً. لا يمكنك تقديم طلبات جديدة.');
      return;
    }

    if (!reqQuantity || !reqAllocation) {
      Alert.alert('خطأ', 'يرجى إكمال البيانات المطلوبة.');
      return;
    }

    const newReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      type: newReqType,
      processNumber: reqProcessNo || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      quantity: reqQuantity,
      allocation: reqAllocation,
      station: reqStation,
      status: 'قيد المراجعة',
      vehicleId: userVehicle.id,
      driverName: userVehicle.driverName
    };

    setRequests([newReq, ...requests]);
    Alert.alert('نجاح', 'تم إرسال الطلب وإشعار المسؤول بنجاح.');
    setReqProcessNo('');
    setReqQuantity('');
    setReqAllocation('');
    setReqStation('');
  };

  const handleAdminApproval = (reqId: string, status: 'تم الاعتماد' | 'مرفوض') => {
    setRequests(
      requests.map((r) => (r.id === reqId ? { ...r, status } : r))
    );
    Alert.alert('إشعار', `تم تحديث حالة الطلب إلى (${status}) وتم إشعار المستخدم.`);
  };

  const handleToggleVehicleStatus = (status: 'في الخدمة' | 'موقف') => {
    setVehicles(
      vehicles.map((v) => (v.id === selectedVehicleForStatus ? { ...v, status } : v))
    );
    if (selectedVehicleForStatus === userVehicle.id) {
      setUserVehicle({ ...userVehicle, status });
    }
    Alert.alert('تم', `تم تغيير حالة السيارة إلى (${status}).`);
  };

  // --- Helper Renderers ---
  const getStatusBadge = (status: string) => {
    let bg = '#FFC107';
    if (status === 'تم الاعتماد') bg = '#4CAF50';
    if (status === 'مرفوض') bg = '#F44336';
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.roleSwitchBtn}
          onPress={() =>
            setCurrentUserRole(currentUserRole === 'user' ? 'admin' : 'user')
          }
        >
          <Text style={styles.roleSwitchText}>
            التحويل إلى: {currentUserRole === 'user' ? 'حساب المسؤول' : 'حساب المستخدم'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? 'تطبيق أطلس - المستخدِم' : 'تطبيق أطلس - المسؤول'}
        </Text>
      </View>

      {/* Main Screen Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ================= USER VIEWS ================= */}
        {currentUserRole === 'user' && (
          <>
            {/* 1. طلباتي */}
            {currentTab === 'requests_status' && (
              <View>
                <Text style={styles.sectionTitle}>📋 قائمة طلباتي</Text>
                {requests.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>طلب {item.type}</Text>
                      {getStatusBadge(item.status)}
                    </View>
                    <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                    <Text style={styles.cardDetail}>التاريخ: {item.date}</Text>
                    <Text style={styles.cardDetail}>الكمية: {item.quantity}</Text>
                    <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 2. شاشة بيانات السيارة المسجلة بالحساب */}
            {currentTab === 'vehicle_info' && (
              <View>
                <View style={styles.customTitleRow}>
                  <TouchableOpacity onPress={() => setCurrentTab('requests_status')}>
                    <Text style={styles.largeBackArrow}>➔</Text>
                  </TouchableOpacity>
                  <Text style={styles.accordionHeader}>البيانات الشخصية والسيارة</Text>
                </View>

                <View style={styles.accordionCard}>
                  <Text style={styles.accordionLabel}>اسم السيارة: {userVehicle.name}</Text>
                  <Text style={styles.accordionLabel}>رقم السيارة: {userVehicle.plateNumber}</Text>
                  <Text style={styles.accordionLabel}>اسم السائق: {userVehicle.driverName}</Text>
                  <Text style={styles.accordionLabel}>نوع السيارة: {userVehicle.type}</Text>
                  <Text style={styles.accordionLabel}>الحمولة: {userVehicle.capacity}</Text>
                  <Text style={styles.accordionLabel}>نوع النقل: {userVehicle.transportType}</Text>
                  <Text style={styles.accordionLabel}>الموديل: {userVehicle.model}</Text>
                  <Text style={styles.accordionLabel}>عدد الركاب: {userVehicle.passengers}</Text>
                  <Text style={styles.accordionLabel}>نوع الوقود: {userVehicle.fuelType}</Text>
                  <Text style={styles.accordionLabel}>
                    حالة السيارة:{' '}
                    <Text
                      style={{
                        color: userVehicle.status === 'في الخدمة' ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}
                    >
                      {userVehicle.status}
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* 3. طلب خدمة (تحديث اسم طلب المحروقات) */}
            {currentTab === 'request_service' && (
              <View>
                <Text style={styles.sectionTitle}>🛠️ شاشة طلب خدمة</Text>
                <Text style={styles.inputLabel}>نوع الطلب:</Text>
                <View style={styles.rowTypes}>
                  {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        newReqType === t && styles.activeTypeChip
                      ]}
                      onPress={() => setNewReqType(t)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          newReqType === t && styles.activeTypeChipText
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>التاريخ (تلقائي):</Text>
                <TextInput
                  style={styles.inputDisabled}
                  value={new Date().toISOString().split('T')[0]}
                  editable={false}
                />

                <Text style={styles.inputLabel}>رقم العملية:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل رقم العملية"
                  value={reqProcessNo}
                  onChangeText={setReqProcessNo}
                />

                <Text style={styles.inputLabel}>الكمية / التكلفة:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل الكمية"
                  value={reqQuantity}
                  onChangeText={setReqQuantity}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>المخصص / الغرض:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل المخصص"
                  value={reqAllocation}
                  onChangeText={setReqAllocation}
                />

                <Text style={styles.inputLabel}>المحطة / الورشة:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="اسم المحطة"
                  value={reqStation}
                  onChangeText={setReqStation}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRequest}>
                  <Text style={styles.submitBtnText}>إرسال الطلب</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 4. التقارير */}
            {currentTab === 'reports' && (
              <View>
                <Text style={styles.sectionTitle}>📊 تقارير المستخدم</Text>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>تصفية التقارير:</Text>
                  <TextInput style={styles.input} placeholder="من تاريخ: YYYY-MM-DD" />
                  <TextInput style={styles.input} placeholder="إلى تاريخ: YYYY-MM-DD" />
                </View>

                {requests.map((r) => (
                  <View key={r.id} style={styles.card}>
                    <Text style={styles.cardTitle}>
                      تقرير {r.type} ({r.status})
                    </Text>
                    <Text style={styles.cardDetail}>التاريخ: {r.date}</Text>
                    <Text style={styles.cardDetail}>الكمية: {r.quantity}</Text>
                    <Text style={styles.cardDetail}>المحطة: {r.station || 'غير محدد'}</Text>
                    <Text style={styles.cardDetail}>المخصص: {r.allocation}</Text>
                    <Text style={styles.cardDetail}>
                      الإجمالي: {r.amount || '0'} ريال
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 5. الإعدادات */}
            {currentTab === 'settings' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>⚙️ الإعدادات</Text>
                <Text style={styles.inputLabel}>اسم السيارة ✏️:</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                />

                <Text style={styles.inputLabel}>رقم السيارة ✏️:</Text>
                <TextInput
                  style={styles.input}
                  value={editPlate}
                  onChangeText={setEditPlate}
                />

                <Text style={styles.inputLabel}>اسم السائق ✏️:</Text>
                <TextInput
                  style={styles.input}
                  value={editDriver}
                  onChangeText={setEditDriver}
                />

                <Text style={styles.inputLabel}>تغيير كلمة المرور 🔒:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور الجديدة"
                  secureTextEntry
                  value={newPass}
                  onChangeText={setNewPass}
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => Alert.alert('نجاح', 'تم حفظ بيانات الإعدادات وكلمة المرور.')}
                >
                  <Text style={styles.submitBtnText}>حفظ التغييرات</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ================= ADMIN VIEWS ================= */}
        {currentUserRole === 'admin' && (
          <>
            {/* 6. طلبات الموظفين للمسؤول */}
            {currentTab === 'admin_requests' && (
              <View>
                <Text style={styles.sectionTitle}>🔔 طلبات الموظفين والخدمات</Text>
                {requests.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Text style={styles.cardTitle}>طلب {item.type}</Text>
                    <Text style={styles.cardDetail}>السائق: {item.driverName}</Text>
                    <Text style={styles.cardDetail}>رقم العملية: {item.processNumber}</Text>
                    <Text style={styles.cardDetail}>تاريخ الطلب: {item.date}</Text>
                    <Text style={styles.cardDetail}>المحطة: {item.station || 'غير محدد'}</Text>
                    <Text style={styles.cardDetail}>المخصص: {item.allocation}</Text>
                    <Text style={styles.cardDetail}>الحالة الحالية: {item.status}</Text>

                    {item.status === 'قيد المراجعة' && (
                      <View style={styles.adminActionRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                          onPress={() => handleAdminApproval(item.id, 'تم الاعتماد')}
                        >
                          <Text style={styles.actionBtnText}>موافقة</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
                          onPress={() => handleAdminApproval(item.id, 'مرفوض')}
                        >
                          <Text style={styles.actionBtnText}>رفض</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* 8. إضافة وتعديل وإيقاف سيارة */}
            {currentTab === 'admin_vehicles' && (
              <View>
                <Text style={styles.sectionTitle}>🚗 إضافة وتعديل وإيقاف السيارات</Text>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>حالة تشغيل / إيقاف سيارة:</Text>
                  {vehicles.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.typeChip,
                        selectedVehicleForStatus === v.id && styles.activeTypeChip,
                        { marginVertical: 4 }
                      ]}
                      onPress={() => setSelectedVehicleForStatus(v.id)}
                    >
                      <Text style={styles.typeChipText}>
                        {v.name} ({v.plateNumber}) - {v.status}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.adminActionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                      onPress={() => handleToggleVehicleStatus('في الخدمة')}
                    >
                      <Text style={styles.actionBtnText}>تشغيل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
                      onPress={() => handleToggleVehicleStatus('موقف')}
                    >
                      <Text style={styles.actionBtnText}>إيقاف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* 9. بيانات السائقين */}
            {currentTab === 'admin_drivers' && (
              <View>
                <Text style={styles.sectionTitle}>👨‍✈️ بيانات السائقين</Text>
                {drivers.map((d) => (
                  <View key={d.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{d.name}</Text>
                    <Text style={styles.cardDetail}>الهاتف: {d.phone}</Text>
                    <Text style={styles.cardDetail}>رقم الرخصة: {d.licenseNumber}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => setShowDriverModal(true)}
                >
                  <Text style={styles.submitBtnText}>إضافة سائق جديد</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 10. صلاحيات المستخدمين */}
            {currentTab === 'admin_permissions' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>🔐 إدارة صلاحيات المستخدمين</Text>
                <View style={styles.permRow}>
                  <Text style={styles.permText}>طلب وقود</Text>
                  <Switch
                    value={permissions.requestFuel}
                    onValueChange={(val) =>
                      setPermissions({ ...permissions, requestFuel: val })
                    }
                  />
                </View>
                <View style={styles.permRow}>
                  <Text style={styles.permText}>طلب زيوت</Text>
                  <Switch
                    value={permissions.requestOil}
                    onValueChange={(val) =>
                      setPermissions({ ...permissions, requestOil: val })
                    }
                  />
                </View>
                <View style={styles.permRow}>
                  <Text style={styles.permText}>طلب إطارات</Text>
                  <Switch
                    value={permissions.requestTires}
                    onValueChange={(val) =>
                      setPermissions({ ...permissions, requestTires: val })
                    }
                  />
                </View>
                <View style={styles.permRow}>
                  <Text style={styles.permText}>طلب صيانة</Text>
                  <Switch
                    value={permissions.requestMaintenance}
                    onValueChange={(val) =>
                      setPermissions({ ...permissions, requestMaintenance: val })
                    }
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        {currentUserRole === 'user' ? (
          <>
            <TouchableOpacity onPress={() => setCurrentTab('requests_status')}>
              <Text style={styles.navText}>📋 طلباتي</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('request_service')}>
              <Text style={styles.navText}>🛠️ طلب خدمة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('vehicle_info')}>
              <Text style={styles.navText}>🚗 بياناتي</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('reports')}>
              <Text style={styles.navText}>📊 تقارير</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('settings')}>
              <Text style={styles.navText}>⚙️ إعدادات</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setCurrentTab('admin_requests')}>
              <Text style={styles.navText}>🔔 الطلبات</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('admin_vehicles')}>
              <Text style={styles.navText}>🚗 السيارات</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('admin_drivers')}>
              <Text style={styles.navText}>👨‍✈️ السائقين</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('admin_permissions')}>
              <Text style={styles.navText}>🔐 الصلاحيات</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 4. زر تسجيل الخروج في الأسفل */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('تسجيل الخروج', 'تم تسجيل الخروج بنجاح.')}
      >
        <Text style={styles.logoutText}>🚪 تسجيل الخروج</Text>
      </TouchableOpacity>

      {/* Modal - Add Driver */}
      <Modal visible={showDriverModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>إضافة سائق جديد</Text>
            <TextInput
              style={styles.input}
              placeholder="اسم السائق"
              value={driverNameInput}
              onChangeText={setDriverNameInput}
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => {
                if (driverNameInput) {
                  setDrivers([
                    ...drivers,
                    {
                      id: `d-${Date.now()}`,
                      name: driverNameInput,
                      phone: '770000000',
                      licenseNumber: 'L-New'
                    }
                  ]);
                  setDriverNameInput('');
                  setShowDriverModal(false);
                }
              }}
            >
              <Text style={styles.submitBtnText}>إضافة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  header: {
    backgroundColor: '#0D47A1',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  roleSwitchBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  roleSwitchText: {
    color: '#FFF',
    fontSize: 12
  },
  scrollContent: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'right'
  },
  card: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'right'
  },
  cardDetail: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    textAlign: 'right'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  customTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  largeBackArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D47A1',
    paddingRight: 10
  },
  accordionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F'
  },
  accordionCard: {
    backgroundColor: '#EFEFEF',
    padding: 16,
    borderRadius: 12
  },
  accordionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
    textAlign: 'right'
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 10,
    textAlign: 'right'
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    textAlign: 'right'
  },
  inputDisabled: {
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    textAlign: 'right',
    color: '#666'
  },
  rowTypes: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginVertical: 8
  },
  typeChip: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4
  },
  activeTypeChip: {
    backgroundColor: '#0D47A1'
  },
  typeChipText: {
    color: '#333',
    fontSize: 12
  },
  activeTypeChipText: {
    color: '#FFF'
  },
  submitBtn: {
    backgroundColor: '#0D47A1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#DDD'
  },
  navText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D47A1'
  },
  logoutBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 10,
    alignItems: 'center'
  },
  logoutText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  adminActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  permRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8
  },
  permText: {
    fontSize: 16,
    color: '#333'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12
  }
});

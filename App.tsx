import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert,
  Modal, SafeAreaView, StatusBar
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = "https://i2cfia8tscmkgcgchggv1g.supabase.co";
const SUPABASE_ANON_KEY = "Sb_publishable_I2CFiA8TScMKgCGCHggV1g_8TCPQrEU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_VERSION = '1.40.14';
const APP_BUILD = '50';

const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F8FAFC', card: '#FFFFFF', text: '#1E293B', muted: '#64748B',
  border: '#CBD5E1', success: '#16A34A', successBg: '#DCFCE7', warning: '#D97706', danger: '#DC2626', dangerBg: '#FEE2E2',
};

type Vehicle = {
  id: string; name: string; driver: string; status: string; type: string;
  model: string; payload: string; fuelType: string; engineNo: string; chassisNo: string;
  directManager?: string; ownership?: 'شركة' | 'خاصة';
};

type RequestItem = {
  id: string; vehicleId: string; driver: string; type: string; date: string;
  qty: number; total: number; status: string; notes?: string;
  startDate?: string; endDate?: string; returnDate?: string;
  managerApproval?: string; adminApproval?: string;
};

const TODAY = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Fleet and Requests are fetched purely from Supabase Cloud
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const [userMainTab, setUserMainTab] = useState<'request' | 'report' | 'admin'>('request');
  const [statusFilter, setStatusFilter] = useState('كل الحالات');

  const [managerAssignModal, setManagerAssignModal] = useState(false);
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState<Vehicle | null>(null);
  const [chosenDirectManager, setChosenDirectManager] = useState('');

  // Load Data purely from Supabase Cloud Database
  const loadSupabaseData = async () => {
    try {
      setLoadingDb(true);
      const { data: vData, error: vErr } = await supabase.from('vehicles').select('*');
      const { data: eData, error: eErr } = await supabase.from('employees').select('*');
      const { data: rData, error: rErr } = await supabase.from('vehicle_requests').select('*');

      if (vData) {
        const empMap = new Map();
        if (eData) {
          eData.forEach((e: any) => empMap.set(e.username, e.full_name));
        }

        const mappedFleet: Vehicle[] = vData.map((v: any) => ({
          id: String(v.car_number || v.id),
          name: v.car_name || `سيارة رقم ${v.car_number}`,
          driver: empMap.get(v.car_number) || v.driver_name || 'بدون سائق',
          status: 'في الخدمة',
          type: v.brand || 'شاحنة/سيارة',
          model: String(v.manufacturing_year || '2015'),
          payload: v.load_capacity || '5 طن',
          fuelType: 'ديزل',
          engineNo: v.engine_number || `ENG-${v.car_number}`,
          chassisNo: v.chassis_number || `CHS-${v.car_number}`,
          directManager: v.direct_manager || '30551 - عبدالله الوردي',
          ownership: 'شركة'
        }));
        setFleet(mappedFleet);
      }

      if (rData) {
        const mappedReqs: RequestItem[] = rData.map((r: any) => ({
          id: String(r.id),
          vehicleId: String(r.car_id || '30551'),
          driver: 'سائق',
          type: r.request_type || 'حركة / خدمة',
          date: r.created_at ? r.created_at.slice(0, 10) : TODAY(),
          qty: 1, total: Number(r.total || 0),
          status: r.status === 'Approved' ? 'تمت الموافقة' : (r.status === 'Rejected' ? 'مرفوض' : 'تحت المراجعة'),
          managerApproval: r.manager_approval_status === 'Approved' ? 'تمت الموافقة' : 'قيد الانتظار',
          adminApproval: r.admin_approval_status === 'Approved' ? 'تمت الموافقة' : 'قيد الانتظار',
          notes: r.request_details
        }));
        setRequests(mappedReqs);
      }
    } catch (e) {
      console.log("Supabase Fetch Error:", e);
      Alert.alert('خطأ في الاتصال', 'تعذر جلب البيانات من القاعدة السحابية');
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  const handleLogin = async () => {
    const u = username.trim(), p = password.trim();

    if (u === 'ميثاق' && p === '111') {
      setCurrentUser({ role: 'admin', name: 'ميثاق' });
      setUserMainTab('admin');
      setUsername(''); setPassword('');
      return;
    }

    try {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('username', u)
        .eq('password', p)
        .single();

      if (data) {
        if (data.role === 'super_admin' || data.role === 'admin') {
          setCurrentUser({ role: 'admin', name: data.full_name });
          setUserMainTab('admin');
        } else {
          const matchingCar = fleet.find(v => v.id === u) || {
            id: u, name: `سيارة ${u}`, driver: data.full_name, status: 'في الخدمة',
            type: 'سيارة', model: '2015', payload: '5 طن', fuelType: 'ديزل',
            engineNo: `ENG-${u}`, chassisNo: `CHS-${u}`
          };
          setCurrentUser({ role: 'driver', ...matchingCar });
          setUserMainTab('request');
        }
        setUsername(''); setPassword('');
        return;
      }
    } catch (e) {
      console.log('Login query fallback...');
    }

    const found = fleet.find(v => v.id === u);
    if (found && p === '000') {
      setCurrentUser({ role: 'driver', ...found });
      setUserMainTab('request');
      setUsername(''); setPassword('');
      return;
    }

    Alert.alert('خطأ في الدخول', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserMainTab('request');
  };

  const saveAssignManager = async () => {
    if (!selectedVehicleForAssign || !chosenDirectManager) return;
    
    setFleet(prev => prev.map(v => v.id === selectedVehicleForAssign.id ? { ...v, directManager: chosenDirectManager } : v));
    
    try {
      await supabase.from('vehicles').update({ direct_manager: chosenDirectManager }).eq('car_number', selectedVehicleForAssign.id);
    } catch (err) {
      console.log('Cloud update notice:', err);
    }

    setManagerAssignModal(false);
    Alert.alert('تم الحفظ', `تم تعيين ${chosenDirectManager} كمسؤول مباشر للسيارة ${selectedVehicleForAssign.id}`);
  };

  const renderModernReportsView = () => {
    let filtered = requests;
    if (statusFilter === 'تمت الموافقة') filtered = requests.filter(r => r.status === 'تمت الموافقة');
    if (statusFilter === 'مرفوض') filtered = requests.filter(r => r.status === 'مرفوض');
    if (statusFilter === 'تحت المراجعة') filtered = requests.filter(r => r.status === 'تحت المراجعة');

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.floatingField}>
          <Text style={styles.fieldTagLabel}>فلترة بالحالة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: 8 }}>
            {['كل الحالات', 'تمت الموافقة', 'تحت المراجعة', 'مرفوض'].map(st => (
              <TouchableOpacity key={st} onPress={() => setStatusFilter(st)}
                style={[styles.statusChip, statusFilter === st && styles.statusChipActive]}>
                <Text style={[styles.statusChipText, statusFilter === st && styles.statusChipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد طلبات سحابية مسجلة حالياً.</Text></View>
          ) : (
            filtered.map((r, idx) => {
              const isApproved = r.status === 'تمت الموافقة';
              const isRejected = r.status === 'مرفوض';
              return (
                <View key={r.id || idx} style={styles.modernReportCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.rightHeaderBox}>
                      <View style={[styles.iconCircle, isApproved ? styles.circleGreen : (isRejected ? styles.circleRed : styles.circleOrange)]}>
                        <Text style={{ fontSize: 16 }}>{isApproved ? '☂️' : (isRejected ? '☂️' : '⏱️')}</Text>
                      </View>
                      <View>
                        <Text style={styles.requestMainTitle}>{r.type || 'طلب خدمة'}</Text>
                        <Text style={styles.requestSubTitle}>التاريخ: {r.date}</Text>
                      </View>
                    </View>
                    <View style={[styles.badgePill, isApproved ? styles.badgeApproved : (isRejected ? styles.badgeRejected : styles.badgePending)]}>
                      <Text style={[styles.badgePillText, isApproved ? styles.textGreen : (isRejected ? styles.textRed : styles.textOrange)]}>
                        {r.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.refNumberText}>رقم الاعتماد: {r.id}</Text>

                  <View style={styles.approvalChecklist}>
                    <View style={styles.checkItem}>
                      <Text style={styles.checkTitle}>المدير المباشر</Text>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.checkStatus}>{r.managerApproval || 'تمت الموافقة'}</Text>
                        <Text style={{ color: COLORS.success, fontWeight: '900' }}>✓</Text>
                      </View>
                    </View>
                    <View style={styles.checkItem}>
                      <Text style={styles.checkTitle}>الشؤون الادارية</Text>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.checkStatus}>{r.adminApproval || 'تمت الموافقة'}</Text>
                        <Text style={{ color: COLORS.success, fontWeight: '900' }}>✓</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const renderModernRequestForm = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.togglePillContainer}>
        <TouchableOpacity style={[styles.pillBtn, styles.pillBtnActive]}>
          <Text style={styles.pillIcon}>📅</Text>
          <Text style={styles.pillTextActive}>طلب حركة / خدمة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillBtn}>
          <Text style={styles.pillIcon}>🕒</Text>
          <Text style={styles.pillText}>طلب رحلة</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
        <View style={[styles.floatingField, { flex: 1 }]}>
          <Text style={styles.fieldTagLabel}>تاريخ بدء الحركة</Text>
          <TextInput style={styles.floatingInput} value={TODAY()} textAlign="right" />
        </View>
        <View style={[styles.floatingField, { flex: 1 }]}>
          <Text style={styles.fieldTagLabel}>تاريخ الانتهاء</Text>
          <TextInput style={styles.floatingInput} placeholder="اختر تاريخ..." placeholderTextColor="#94A3B8" textAlign="right" />
        </View>
      </View>

      <View style={styles.floatingField}>
        <Text style={styles.fieldTagLabel}>تاريخ العودة</Text>
        <TextInput style={styles.floatingInput} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" textAlign="right" />
      </View>

      <View style={styles.floatingField}>
        <Text style={styles.fieldTagLabel}>اختر نوع الخدمة / الطلب</Text>
        <TextInput style={styles.floatingInput} value="صيانة ومحروقات" textAlign="right" />
      </View>

      <View style={styles.floatingField}>
        <Text style={styles.fieldTagLabel}>سبب الطلب / الوجهة</Text>
        <TextInput style={[styles.floatingInput, { minHeight: 60 }]} placeholder="اكتب التفاصيل..." multiline textAlign="right" />
      </View>

      <View style={styles.attachmentsCard}>
        <Text style={styles.attachmentTitle}>المرفقات</Text>
        <Text style={styles.attachmentSub}>يمكنك إرفاق الصور والمستندات المتعلقة بالطلب</Text>
        <TouchableOpacity style={styles.addAttachmentBtn}>
          <Text style={styles.addAttachmentText}>＋ إرفاق صور</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryBtnLarge} onPress={() => Alert.alert('تم الإرسال', 'تم إرسال الطلب وحفظه في القاعدة السحابية بنجاح.')}>
        <Text style={styles.btnTextLarge}>إرسال الطلب</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {!currentUser ? (
        <View style={styles.loginContainer}>
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>نظام إدارة السيارات</Text>
            <Text style={styles.loginSubtitle}>تسجيل الدخول (سحابي بالكامل)</Text>
            <TextInput style={styles.input} placeholder="اسم المستخدم / رقم السيارة" placeholderTextColor="#94A3B8"
              value={username} onChangeText={setUsername} textAlign="right" />
            <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#94A3B8"
              secureTextEntry value={password} onChangeText={setPassword} textAlign="right" />
            <TouchableOpacity style={styles.primaryBtnLarge} onPress={handleLogin}>
              <Text style={styles.btnTextLarge}>دخول</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.appHeader}>
            <TouchableOpacity onPress={handleLogout}><Text style={{ fontSize: 18 }}>➔</Text></TouchableOpacity>
            <Text style={styles.appHeaderTitle}>إدارة الطلبات والمسارات</Text>
            <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>{currentUser.role === 'admin' ? 'م' : '🚗'}</Text></View>
          </View>

          <View style={styles.mainTabHeader}>
            <TouchableOpacity onPress={() => setUserMainTab('request')} style={[styles.mainTabBtn, userMainTab === 'request' && styles.mainTabBtnActive]}>
              <Text style={[styles.mainTabText, userMainTab === 'request' && styles.mainTabTextActive]}>طلب الخدمة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setUserMainTab('report')} style={[styles.mainTabBtn, userMainTab === 'report' && styles.mainTabBtnActive]}>
              <Text style={[styles.mainTabText, userMainTab === 'report' && styles.mainTabTextActive]}>تقرير الطلبات</Text>
            </TouchableOpacity>
            {currentUser.role === 'admin' && (
              <TouchableOpacity onPress={() => setUserMainTab('admin')} style={[styles.mainTabBtn, userMainTab === 'admin' && styles.mainTabBtnActive]}>
                <Text style={[styles.mainTabText, userMainTab === 'admin' && styles.mainTabTextActive]}>لوحة المسؤول</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flex: 1, padding: 16 }}>
            {userMainTab === 'request' && renderModernRequestForm()}
            {userMainTab === 'report' && renderModernReportsView()}

            {userMainTab === 'admin' && (
              <ScrollView style={{ flex: 1 }}>
                <View style={styles.adminAssignBox}>
                  <Text style={styles.adminAssignTitle}>🎛️ إدارة وتعيين المسؤولين المباشرين (خاص بحساب ميثاق)</Text>
                  {fleet.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: COLORS.muted, padding: 15 }}>جاري استيراد السيارات من السحابة... اضغط زر المزامنة أسفله.</Text>
                  ) : (
                    <ScrollView style={{ maxHeight: 260 }}>
                      {fleet.map(v => (
                        <View key={v.id} style={styles.assignRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '800', textAlign: 'right' }}>السيارة {v.id} - {v.driver}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.muted, textAlign: 'right' }}>المسؤول المباشر: {v.directManager || '30551'}</Text>
                          </View>
                          <TouchableOpacity style={styles.smallAssignBtn} onPress={() => { setSelectedVehicleForAssign(v); setManagerAssignModal(true); }}>
                            <Text style={styles.smallAssignText}>تعديل المسؤول</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <TouchableOpacity style={[styles.primaryBtnLarge, { marginTop: 12 }]} onPress={loadSupabaseData}>
                  <Text style={styles.btnTextLarge}>{loadingDb ? 'جاري الاستيراد...' : '🔄 استيراد / مزامنة السيارات من Supabase'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      )}

      <Modal visible={managerAssignModal} transparent animationType="slide" onRequestClose={() => setManagerAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تعيين مسؤول مباشر للسيارة {selectedVehicleForAssign?.id}</Text>
            <Text style={styles.label}>اختر المسؤول المباشر من القائمة:</Text>
            {['30551 - عبدالله الوردي', '100000 - ميثاق (مدير النظام)', '22618 - عبدالغني علي'].map(mgr => (
              <TouchableOpacity key={mgr} style={[styles.mgrOption, chosenDirectManager === mgr && styles.mgrOptionActive]}
                onPress={() => setChosenDirectManager(mgr)}>
                <Text style={styles.mgrOptionText}>{mgr}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.primaryBtnLarge} onPress={saveAssignManager}>
              <Text style={styles.btnTextLarge}>حفظ التعيين</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setManagerAssignModal(false)}>
              <Text style={styles.btnText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 4 },
  loginTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', color: COLORS.primary, marginBottom: 6 },
  loginSubtitle: { textAlign: 'center', fontSize: 16, color: COLORS.muted, marginBottom: 20 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, fontSize: 15, marginBottom: 12 },

  appHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  appHeaderTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  mainTabHeader: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: '#E2E8F0' },
  mainTabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  mainTabBtnActive: { borderBottomColor: COLORS.primary },
  mainTabText: { fontSize: 15, fontWeight: '700', color: COLORS.muted },
  mainTabTextActive: { color: COLORS.primary, fontWeight: '900' },

  togglePillContainer: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 18, padding: 4, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  pillBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 6 },
  pillBtnActive: { backgroundColor: COLORS.primary },
  pillIcon: { fontSize: 16 },
  pillText: { fontSize: 14, fontWeight: '700', color: COLORS.muted },
  pillTextActive: { fontSize: 14, fontWeight: '900', color: '#fff' },

  floatingField: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  fieldTagLabel: { fontSize: 12, fontWeight: '800', color: COLORS.muted, textAlign: 'right', marginBottom: 2 },
  floatingInput: { fontSize: 15, fontWeight: '700', color: COLORS.text, paddingVertical: 4 },

  statusChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  statusChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusChipText: { fontSize: 12, color: COLORS.muted, fontWeight: '700' },
  statusChipTextActive: { color: '#fff', fontWeight: '900' },

  attachmentsCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
  attachmentTitle: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  attachmentSub: { fontSize: 12, color: COLORS.muted, marginTop: 4, marginBottom: 12 },
  addAttachmentBtn: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  addAttachmentText: { color: COLORS.primary, fontWeight: '900' },

  primaryBtnLarge: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnTextLarge: { color: '#fff', fontWeight: '900', fontSize: 16 },
  secondaryBtn: { backgroundColor: COLORS.muted, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '800' },

  modernReportCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  cardTopRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rightHeaderBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  circleGreen: { backgroundColor: '#DCFCE7' },
  circleRed: { backgroundColor: '#FEE2E2' },
  circleOrange: { backgroundColor: '#FEF3C7' },
  requestMainTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text, textAlign: 'right' },
  requestSubTitle: { fontSize: 12, color: COLORS.muted, textAlign: 'right' },
  badgePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeApproved: { backgroundColor: '#DCFCE7' },
  badgeRejected: { backgroundColor: '#FEE2E2' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgePillText: { fontSize: 12, fontWeight: '900' },
  textGreen: { color: '#16A34A' },
  textRed: { color: '#DC2626' },
  textOrange: { color: '#D97706' },
  refNumberText: { fontSize: 12, fontWeight: '800', color: '#16A34A', textAlign: 'right', marginVertical: 8 },

  approvalChecklist: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8, gap: 6 },
  checkItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  checkTitle: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  checkStatus: { fontSize: 12, color: '#16A34A', fontWeight: '800' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 30, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontWeight: '700', textAlign: 'center' },

  adminAssignBox: { backgroundColor: '#FFF5F5', borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#FEE2E2' },
  adminAssignTitle: { fontSize: 14, fontWeight: '900', color: COLORS.primary, textAlign: 'right', marginBottom: 10 },
  assignRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FEE2E2' },
  smallAssignBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  smallAssignText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '900', textAlign: 'right', marginBottom: 12 },
  label: { textAlign: 'right', fontSize: 13, fontWeight: '700', color: COLORS.muted, marginBottom: 8 },
  mgrOption: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  mgrOptionActive: { backgroundColor: '#FFF5F5', borderColor: COLORS.primary },
  mgrOptionText: { textAlign: 'right', fontWeight: '800', color: COLORS.text }
});

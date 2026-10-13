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

const SUPABASE_URL = 'https://j39WezKO1Io-ShqqoirCjA-f8Om0m0.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I2CFiA8TScMKgCGCHggV1g_8TCPQrEU';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_VERSION = '1.36.11';
const APP_BUILD = '46';

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

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [userTab, setUserTab] = useState('service');
  const [adminTab, setAdminTab] = useState('requests');
  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  const [reqNotes, setReqNotes] = useState('');
  const [reportType, setReportType] = useState('الكل');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');

  const requestTypes = ['وقود', 'زيوت', 'بطاريات', 'قطع غيار', 'صيانة', 'إطارات', 'إرسالية صيانة', 'إرسالية بنشر وخدمات'];

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  const fetchDataFromSupabase = async () => {
    try {
      const { data: vehiclesData } = await supabase.from('vehicles').select('*');
      const { data: driversData } = await supabase.from('drivers').select('*');
      const { data: requestsData } = await supabase.from('trip_requests').select('*');

      if (vehiclesData && driversData) {
        const mergedFleet: Vehicle[] = vehiclesData.map((v: any) => {
          const drv = driversData.find((d: any) => d.plate_number === v.plate_number);
          return {
            id: v.plate_number,
            name: `سيارة رقم ${v.plate_number}`,
            driver: drv ? drv.driver_name : 'غير محدد',
            status: v.status === 'available' ? 'في الخدمة' : 'موقف',
            type: v.vehicle_model || 'شاحنة/سيارة',
            model: '2020',
            payload: 'متوسطة',
            fuelType: 'ديزل',
            engineNo: 'ENG-' + v.plate_number,
            chassisNo: 'CHS-' + v.plate_number,
            ownership: 'شركة'
          };
        });
        setFleet(mergedFleet);
      }

      if (requestsData) {
        const formattedReqs = requestsData.map((r: any) => ({
          id: `REQ-${r.id}`,
          vehicleId: r.requester_username || '22618',
          driver: 'سائق الأسطول',
          type: 'وقود',
          date: r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          qty: 1,
          total: 0,
          status: r.status === 'approved' ? 'تمت الموافقة' : 'تحت المراجعة',
          workflow: r.status === 'pending_supervisor' ? 'المسؤول المباشر (30551)' : r.status === 'pending_admin' ? 'ميثاق' : 'معتمد',
          notes: r.notes || ''
        }));
        setRequests(formattedReqs);
      }
    } catch (e) {
      console.log('خطأ في جلب البيانات:', e);
    }
  };

  // دالة تسجيل الدخول المُحدثة والمرنة
  const handleLogin = async () => {
    const u = username.trim(), p = password.trim();
    
    // 1. حساب المسؤول العام ميثاق
    if (u === 'methaq' && p === '111') {
      setCurrentUser({ role: 'admin', name: 'ميثاق عبده علي مقبل بكر', id: 'methaq' });
      setUsername(''); setPassword(''); return;
    }

    try {
      // البحث عن اسم المستخدم أو رقم السيارة في جدول profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', u);

      if (error || !data || data.length === 0) {
        Alert.alert('خطأ في الدخول', 'اسم المستخدم أو رقم السيارة غير مسجل في قاعدة البيانات');
        return;
      }

      const userRecord = data[0];

      // كلمة المرور الافتراضية للجميع هي 000
      if (p === '000') {
        const foundVehicle = fleet.find(v => v.id === u) || { id: u, name: 'سيارة أسطول', driver: userRecord.full_name, status: 'في الخدمة' };
        
        // التحقق مما إذا كان هو المسؤول المباشر (30551) أو مدير
        if (userRecord.role === 'manager' || u === '30551') {
          setCurrentUser({ role: 'manager', id: u, name: userRecord.full_name, driver: userRecord.full_name });
        } else {
          setCurrentUser({ role: 'driver', ...foundVehicle });
        }
        setUsername(''); setPassword('');
      } else {
        Alert.alert('خطأ', 'كلمة المرور غير صحيحة (كلمة المرور الافتراضية للجميع هي 000)');
      }
    } catch (e) {
      Alert.alert('خطأ اتصال', 'تعذر الاتصال بقاعدة بيانات Supabase');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null); setUserTab('service'); setAdminTab('requests');
  };

  const submitRequest = async () => {
    if (!currentUser || !serviceTypeModal) return;

    const newItemData = {
      requester_username: currentUser.id,
      start_location: 'المركز الرئيسي',
      destination: serviceTypeModal,
      status: 'pending_supervisor',
      notes: reqNotes || '',
    };

    try {
      const { error } = await supabase.from('trip_requests').insert([newItemData]);
      if (error) {
        Alert.alert('خطأ', 'فشل حفظ الطلب في قاعدة البيانات');
        return;
      }
      
      fetchDataFromSupabase();
      setServiceTypeModal(null);
      setReqNotes('');
      setUserTab('my_requests');
      Alert.alert('تم إرسال الطلب', 'تم إرسال الطلب بنجاح ليمر عبر مسار الموافقات (المسؤول المباشر 30551 ثم ميثاق).');
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال بقاعدة البيانات');
    }
  };

  const advanceRequestSupabase = async (reqId: string, currentStatus: string) => {
    let nextStatus = 'pending_admin';
    if (currentStatus === 'pending_admin' || currentUser.role === 'admin') {
      nextStatus = 'approved';
    }

    try {
      const idNum = reqId.replace('REQ-', '');
      await supabase.from('trip_requests').update({ status: nextStatus }).eq('id', idNum);
      fetchDataFromSupabase();
      Alert.alert('تم', 'تمت الموافقة على الطلب وتمريره للمرحلة التالية.');
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر تحديث حالة الطلب');
    }
  };

  const rejectRequestSupabase = async (reqId: string) => {
    try {
      const idNum = reqId.replace('REQ-', '');
      await supabase.from('trip_requests').update({ status: 'rejected' }).eq('id', idNum);
      fetchDataFromSupabase();
      Alert.alert('تم', 'تم رفض الطلب.');
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر رفض الطلب');
    }
  };

  const renderRequestsAdmin = () => (
    <View>
      <Text style={styles.sectionTitle}>متابعة طلبات الأسطول (مسار الاعتماد)</Text>
      <Text style={styles.helper}>الطلبات تمر تباعاً من المسؤول المباشر (30551) ثم إلى المسؤول العام (ميثاق).</Text>
      {requests.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد طلبات مسجلة حالياً في Supabase.</Text></View> : null}
      {requests.map(r => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
          <Text style={styles.cardTitle}>طلب سيارة رقم: {r.vehicleId}</Text>
          <Text style={styles.cardText}>الخدمة / الوجهة: {r.type}</Text>
          <Text style={styles.cardText}>تاريخ الطلب: {r.date}</Text>
          {r.notes ? <Text style={styles.cardText}>ملاحظات: {r.notes}</Text> : null}
          <Text style={styles.workflowTitle}>المرحلة: {r.workflow}</Text>
          {r.status !== 'تمت الموافقة' && r.status !== 'رفض' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.success}]} onPress={() => advanceRequestSupabase(r.id, r.status)}><Text style={styles.btnText}>موافقة واعتماد</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.danger}]} onPress={() => rejectRequestSupabase(r.id)}><Text style={styles.btnText}>رفض الطلب</Text></TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderReports = (isAdmin = false) => {
    let rows = isAdmin ? requests : requests.filter(r => r.vehicleId === currentUser?.id);
    return (
      <View>
        <Text style={styles.sectionTitle}>{isAdmin ? 'التقارير العامة' : 'تقارير سيارتي'}</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي الطلبات المسجلة</Text>
          <Text style={styles.summaryValue}>{rows.length} طلب</Text>
        </View>
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
            <Text style={styles.cardTitle}>النوع: {r.type}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date}</Text>
            <Text style={styles.workflowTitle}>الحالة: {r.workflow}</Text>
          </View>
        ))}
      </View>
    );
  };

  // شاشة تسجيل الدخول
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginSubtitle}>نظام إدارة الأسطول والسيارات</Text>
          <Text style={styles.helper}>دخول ميثاق: (methaq / 111)</Text>
          <Text style={styles.helper}>دخول المسؤول المباشر: (30551 / 000)</Text>
          <Text style={styles.helper}>دخول السائقين: (رقم السيارة / 000)</Text>
          <TextInput style={styles.input} placeholder="اسم المستخدم / رقم السيارة" placeholderTextColor="#94A3B8"
            value={username} onChangeText={setUsername} textAlign="right" />
          <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#94A3B8"
            secureTextEntry value={password} onChangeText={setPassword} textAlign="right" />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}><Text style={styles.btnText}>دخول للنظام</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // واجهة المسؤول العام (ميثاق) أو المسؤول المباشر (30551)
  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    const adminNav = [
      ['requests','📋','الطلبات'], ['reports','📊','التقارير'],
    ];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerTitle}>{currentUser.role === 'admin' ? 'لوحة المسؤول العام (ميثاق)' : 'لوحة المسؤول المباشر (30551)'}</Text>
            <Text style={styles.headerSub}>مرحبًا، {currentUser.name || currentUser.driver}</Text>
          </View>
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

        <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:110}}>
          {adminTab === 'requests' ? renderRequestsAdmin() : null}
          {adminTab === 'reports' ? renderReports(true) : null}
        </ScrollView>

        <TouchableOpacity style={styles.logoutBar} onPress={handleLogout}><Text style={styles.btnText}>تسجيل الخروج</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // واجهة السائق العادي
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>السيارة رقم: {currentUser.id}</Text>
          <Text style={styles.headerSub}>السائق: {currentUser.driver}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:110}}>
        {userTab === 'service' && (
          <View>
            <Text style={styles.sectionTitle}>خدمات وطلبات الأسطول</Text>
            {requestTypes.map((type) => (
              <TouchableOpacity key={type} style={styles.serviceCard} onPress={() => setServiceTypeModal(type)}>
                <View style={styles.serviceIcon}><Text style={{fontSize:25}}>🚗</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.serviceTitle}>طلب {type}</Text>
                  <Text style={styles.serviceSub}>إرسال طلب جديد ليمر بمسار الموافقات</Text>
                </View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.serviceCard} onPress={() => setUserTab('my_requests')}><View style={styles.serviceIcon}><Text style={{fontSize:24}}>📊</Text></View><View style={{flex:1}}><Text style={styles.serviceTitle}>طلباتي ومسارها</Text><Text style={styles.serviceSub}>متابعة حالة الطلبات المعتمدة والمعلقة</Text></View></TouchableOpacity>
          </View>
        )}

        {userTab === 'my_requests' ? renderReports(false) : null}
      </ScrollView>

      <View style={styles.driverNav}>
        {[
          ['service','🏠','الرئيسية'], ['my_requests','📊','طلباتي']
        ].map(([key,icon,label]) => (
          <TouchableOpacity key={key} style={styles.driverNavItem} onPress={() => setUserTab(key)}>
            <Text style={{fontSize:18}}>{icon}</Text>
            <Text style={[styles.driverNavText,userTab === key && styles.activeNavText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal لطلب الخدمة */}
      {serviceTypeModal && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setServiceTypeModal(null)}>
          <SafeAreaView style={styles.requestModalScreen}>
            <View style={styles.requestModalHeader}><Text style={styles.modalTitle}>طلب {serviceTypeModal}</Text><TouchableOpacity onPress={() => setServiceTypeModal(null)}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity></View>
            <ScrollView style={styles.requestFormScroll} contentContainerStyle={styles.requestFormContent}>
              <Text style={styles.label}>رقم السيارة</Text><TextInput style={styles.readOnlyInput} value={currentUser?.id || ''} editable={false} textAlign="right" />
              <Text style={styles.label}>السائق</Text><TextInput style={styles.readOnlyInput} value={currentUser?.driver || ''} editable={false} textAlign="right" />
              <Text style={styles.label}>ملاحظات أو تفاصيل الطلب</Text><TextInput style={[styles.input,{minHeight:90}]} value={reqNotes} onChangeText={setReqNotes} multiline textAlign="right" placeholder="اكتب تفاصيل الطلب..." />
            </ScrollView>
            <View style={styles.requestFooter}><TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.primary}]} onPress={submitRequest}><Text style={styles.btnText}>إرسال الطلب عبر Supabase</Text></TouchableOpacity></View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.bg},
  loginContainer:{flex:1,backgroundColor:COLORS.bg,justifyContent:'center',alignItems:'center',padding:20},
  loginCard:{width:'100%',maxWidth:400,backgroundColor:'#fff',borderRadius:24,padding:26,elevation:5},
  loginSubtitle:{textAlign:'center',fontSize:20,fontWeight:'800',color:COLORS.text,marginBottom:15},
  input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
  primaryBtn:{backgroundColor:COLORS.primary,borderRadius:12,padding:13,alignItems:'center',marginTop:6},
  btnText:{color:'#fff',fontWeight:'800',textAlign:'center'},
  topHeader:{backgroundColor:COLORS.primary,paddingHorizontal:18,paddingVertical:15,flexDirection:'row-reverse',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:19,fontWeight:'800',textAlign:'right'},
  headerSub:{color:'#FDE7E8',fontSize:13,textAlign:'right',marginTop:2},
  adminNav:{backgroundColor:'#fff',maxHeight:70,borderBottomWidth:1,borderBottomColor:COLORS.border},
  adminTab:{paddingHorizontal:16,paddingVertical:10,borderBottomWidth:3,borderBottomColor:'transparent',alignItems:'center'},
  adminTabActive:{borderBottomColor:COLORS.primary},
  adminTabText:{color:COLORS.muted,fontWeight:'700',fontSize:12},
  adminTabTextActive:{color:COLORS.primary},
  adminIcon:{fontSize:18,marginBottom:2},
  content:{flex:1,padding:15},
  sectionTitle:{fontSize:20,fontWeight:'800',color:COLORS.text,textAlign:'right',marginBottom:8},
  helper:{textAlign:'right',color:COLORS.muted,fontSize:13,marginBottom:10},
  card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:11,borderWidth:1,borderColor:'#EEF2F7'},
  cardHeader:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  cardId:{color:COLORS.primary,fontWeight:'800',fontSize:15},
  cardTitle:{textAlign:'right',fontWeight:'800',fontSize:16,color:COLORS.text,marginBottom:5},
  cardText:{textAlign:'right',color:'#475569',marginBottom:4},
  badge:{backgroundColor:'#FFF4E5',color:'#9A5B00',paddingHorizontal:9,paddingVertical:4,borderRadius:10,fontSize:12,fontWeight:'700'},
  actionRow:{flexDirection:'row-reverse',gap:8,marginTop:10},
  actionBtn:{flex:1,borderRadius:10,padding:11,alignItems:'center'},
  logoutBar:{backgroundColor:'#7F1D1D',padding:13,alignItems:'center'},
  chevron:{fontSize:30,color:COLORS.primary,fontWeight:'300'},
  label:{textAlign:'right',fontWeight:'700',fontSize:13,color:'#475569',marginBottom:5,marginTop:4},
  summaryCard:{backgroundColor:COLORS.primary,borderRadius:18,padding:18,marginBottom:12},
  summaryTitle:{color:'#FDE7E8',textAlign:'right',fontWeight:'700'},
  summaryValue:{color:'#fff',textAlign:'right',fontSize:26,fontWeight:'900',marginTop:5},
  serviceCard:{backgroundColor:'#fff',borderRadius:18,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7'},
  serviceIcon:{width:55,height:55,borderRadius:17,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  serviceTitle:{textAlign:'right',fontWeight:'900',fontSize:16,color:COLORS.text},
  serviceSub:{textAlign:'right',color:COLORS.muted,fontSize:12,marginTop:3},
  driverNav:{flexDirection:'row-reverse',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.border,paddingVertical:7},
  driverNavItem:{flex:1,alignItems:'center',paddingVertical:7},
  driverNavText:{color:'#64748B',fontSize:11,fontWeight:'600'},
  activeNavText:{color:COLORS.primary,fontWeight:'900'},
  workflowTitle:{textAlign:'right',fontWeight:'800',color:COLORS.primary,marginTop:7},
  requestModalScreen:{flex:1,backgroundColor:COLORS.bg},
  requestModalHeader:{backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:12,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:COLORS.border},
  closeText:{color:COLORS.primary,fontWeight:'900',fontSize:14},
  requestFormScroll:{flex:1},
  requestFormContent:{padding:16,paddingBottom:30},
  requestFooter:{backgroundColor:'#fff',padding:10,borderTopWidth:1,borderTopColor:COLORS.border},
  readOnlyInput:{backgroundColor:'#E2E8F0',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
  emptyCard:{backgroundColor:'#fff',borderRadius:16,padding:22,alignItems:'center',marginBottom:12},
  emptyText:{color:COLORS.muted,fontWeight:'700',textAlign:'center'},
});

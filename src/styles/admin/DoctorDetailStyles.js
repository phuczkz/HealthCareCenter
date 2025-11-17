// src/styles/admin/DoctorDetailStyles.js
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: { padding: 8 },
  homeButton: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },

  scrollContent: { padding: 20, paddingTop: 24 },

  // AVATAR
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 16,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '800' },
  doctorName: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  department: { fontSize: 16, color: '#64748B', fontWeight: '600' },

  // INFO GRID
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  infoCard: {
    width: '48%',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoLabel: { fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: '600' },
  infoValue: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 4 },

  // SCHEDULE
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  scheduleTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginLeft: 8 },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayName: { fontSize: 15, color: '#64748B', fontWeight: '600' },
  dayNameActive: { color: '#10B981', fontWeight: '700' },
  daySlots: { fontSize: 15, color: '#94A3B8' },
  daySlotsActive: { color: '#1E293B', fontWeight: '600' },
  daySlotsOff: { color: '#94A3B8', fontStyle: 'italic' },

  // ACTION
  actionContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
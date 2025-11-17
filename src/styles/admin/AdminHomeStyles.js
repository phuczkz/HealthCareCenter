// src/styles/admin/AdminHomeStyles.js
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
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },

  // HEADER - BO TRÒN MẠNH
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#DBEAFE',
    fontWeight: '500',
  },

  // AVATAR - VÒNG TRÒN HOÀN HẢO
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,  // 50%
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },

  scrollContent: { padding: 16, paddingTop: 20 },

  // STATS - BO TRÒN + ICON VÒNG TRÒN
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  statCard: {
    padding: 14,
    borderRadius: 28,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,  // VÒNG TRÒN
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  // MENU - BO TRÒN HOÀN HẢO (CẢ 2 LỚP)
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    marginBottom: 12,
  },
  menuCard: {
    borderRadius: 28,
    overflow: 'hidden',  // QUAN TRỌNG: Ẩn phần tràn
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 28,  // BO TRÒN CẢ LỚP CON
  },
  menuIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,  // VÒNG TRÒN ICON
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 16,
  },
});
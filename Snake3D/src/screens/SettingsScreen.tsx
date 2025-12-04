import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  StatusBar,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, Language } from '../types';
import { Button } from '../components/Button';
import { useSettingsStore } from '../store/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { language, soundEnabled, setLanguage, setSoundEnabled } =
    useSettingsStore();

  const languages: Array<{ code: Language; name: string }> = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' },
  ];

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    // Force RTL update for Arabic
    I18nManager.forceRTL(lang === 'ar');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.optionGroup}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.option,
                  language === lang.code && styles.optionActive,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text
                  style={[
                    styles.optionText,
                    language === lang.code && styles.optionTextActive,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sound Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sound')}</Text>
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[styles.option, soundEnabled && styles.optionActive]}
              onPress={() => setSoundEnabled(true)}
            >
              <Text
                style={[
                  styles.optionText,
                  soundEnabled && styles.optionTextActive,
                ]}
              >
                {t('settings.on')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, !soundEnabled && styles.optionActive]}
              onPress={() => setSoundEnabled(false)}
            >
              <Text
                style={[
                  styles.optionText,
                  !soundEnabled && styles.optionTextActive,
                ]}
              >
                {t('settings.off')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title={t('common.back')}
          onPress={() => navigation.goBack()}
          variant="secondary"
          style={styles.backButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 40,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 15,
    fontWeight: '600',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  optionGroup: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  optionActive: {
    borderColor: '#00d9ff',
    backgroundColor: '#0f3460',
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
  },
  optionTextActive: {
    color: '#00d9ff',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 40,
  },
});
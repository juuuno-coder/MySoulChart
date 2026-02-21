import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AnalysisMode, UserProfile } from '../../shared/types';
import { analyzeFace } from '../../shared/services/api';
import { showToast } from '../../shared/utils/toast';

const MODE_NAMES: Record<string, string> = {
  face: '관상 분석', zodiac: '별자리', mbti: 'MBTI',
  saju: '사주명리', blood: '혈액형', couple: '커플 궁합',
  unified: '통합 영혼 상담',
};

type Question = {
  id: string;
  text: string;
  type: 'text' | 'select' | 'camera';
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

function getQuestions(mode: string): Question[] {
  const questions: Question[] = [];

  // 관상: 카메라/갤러리 업로드
  if (mode === 'face') {
    questions.push({
      id: 'faceImage',
      text: '그대의 얼굴을 보여주시게.\n관상에는 운명이 새겨져 있다네.',
      type: 'camera',
      required: true,
    });
  }

  // 이름
  questions.push({
    id: 'name',
    text: '이름을 알려주시게.\n이름은 영혼의 첫 번째 진동이니.',
    type: 'text',
    required: true,
    placeholder: '예: 홍길동',
  });

  // 성별 (unified)
  if (mode === 'unified') {
    questions.push({
      id: 'gender',
      text: '성별을 알려주시게.',
      type: 'select',
      required: true,
      options: [
        { value: 'male', label: '남성' },
        { value: 'female', label: '여성' },
      ],
    });
  }

  // 생년월일 (MBTI, 혈액형 제외)
  if (mode !== 'mbti' && mode !== 'blood') {
    questions.push({
      id: 'birthDate',
      text: '언제 이 세상에 태어났는가?\n별들의 배치가 운명을 결정한다네.',
      type: 'text',
      required: true,
      placeholder: '예: 1990-03-15',
    });

    questions.push({
      id: 'calendarType',
      text: '양력인가, 음력인가?',
      type: 'select',
      required: true,
      options: [
        { value: 'solar', label: '양력' },
        { value: 'lunar', label: '음력' },
      ],
    });
  }

  // 혈액형
  if (['blood', 'face', 'saju', 'zodiac', 'unified'].includes(mode)) {
    questions.push({
      id: 'bloodType',
      text: '그대의 혈액형은?',
      type: 'select',
      required: mode === 'blood' || mode === 'unified',
      options: [
        ...(mode !== 'blood' && mode !== 'unified' ? [{ value: '', label: '모르겠음' }] : []),
        { value: 'A', label: 'A형' },
        { value: 'B', label: 'B형' },
        { value: 'O', label: 'O형' },
        { value: 'AB', label: 'AB형' },
      ],
    });
  }

  // MBTI
  if (['mbti', 'face', 'saju', 'zodiac', 'unified'].includes(mode)) {
    questions.push({
      id: 'mbti',
      text: mode === 'mbti' ? '그대의 MBTI 유형은?' : 'MBTI를 안다면 알려주게.',
      type: 'text',
      required: mode === 'mbti' || mode === 'unified',
      placeholder: '예: INFP',
    });
  }

  return questions;
}

export default function FormScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [currentValue, setCurrentValue] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const questions = getQuestions(mode || 'unified');
  const currentQuestion = questions[step];
  const isLastStep = step === questions.length - 1;

  const handleNext = async () => {
    if (!currentValue && !imageBase64 && currentQuestion.required) return;

    let updatedProfile = { ...profile };

    // 관상 분석: 사진 업로드 후 AI 분석
    if (currentQuestion.id === 'faceImage' && imageBase64) {
      setIsAnalyzing(true);
      try {
        const features = await analyzeFace(imageBase64);
        const parts: string[] = [];
        if (features.faceShape) parts.push(`얼굴형: ${features.faceShape}`);
        if (features.samjeong) {
          parts.push(`삼정 - 상정: ${features.samjeong.upper}, 중정: ${features.samjeong.middle}, 하정: ${features.samjeong.lower}`);
        }
        if (features.eyes) parts.push(`눈: ${features.eyes}`);
        if (features.eyebrows) parts.push(`눈썹: ${features.eyebrows}`);
        if (features.nose) parts.push(`코: ${features.nose}`);
        if (features.mouth) parts.push(`입: ${features.mouth}`);
        if (features.ears) parts.push(`귀: ${features.ears}`);
        if (features.forehead) parts.push(`이마: ${features.forehead}`);
        if (features.chin) parts.push(`턱: ${features.chin}`);
        if (features.impression) parts.push(`종합 인상: ${features.impression}`);
        updatedProfile.faceFeatures = parts.join(' / ');
        updatedProfile.faceImage = imageBase64;
      } catch (error: any) {
        setIsAnalyzing(false);
        showToast('error', error.message || '관상 분석에 실패했습니다.');
        return;
      }
      setIsAnalyzing(false);
    } else {
      (updatedProfile as any)[currentQuestion.id] = currentValue;
    }

    setProfile(updatedProfile);

    if (isLastStep) {
      // 채팅 화면으로 이동 (프로필 데이터를 params로 전달)
      router.replace({
        pathname: `/chat/${mode}`,
        params: { profile: JSON.stringify(updatedProfile) },
      });
    } else {
      setStep(step + 1);
      setCurrentValue('');
    }
  };

  // 카메라 촬영
  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
    if (photo) {
      setImageUri(photo.uri);
      setImageBase64(`data:image/jpeg;base64,${photo.base64}`);
      setShowCamera(false);
      setCurrentValue('captured');
    }
  };

  // 갤러리 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setCurrentValue('picked');
    }
  };

  // 카메라 화면
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.cameraCloseBtn}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cameraBtnText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={takePicture}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: MODE_NAMES[mode || ''] || '정보 입력' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content}>
            {/* 진행률 */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((step + 1) / questions.length) * 100}%` }]} />
            </View>
            <Text style={styles.stepText}>{step + 1} / {questions.length}</Text>

            {/* 질문 */}
            <Text style={styles.question}>{currentQuestion.text}</Text>

            {/* 입력 */}
            {currentQuestion.type === 'camera' ? (
              <View style={styles.cameraSection}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderIcon}>📷</Text>
                    <Text style={styles.placeholderText}>사진을 촬영하거나 선택하세요</Text>
                  </View>
                )}
                <View style={styles.cameraButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#9333ea' }]}
                    onPress={async () => {
                      if (!cameraPermission?.granted) {
                        const { granted } = await requestCameraPermission();
                        if (!granted) {
                          showToast('error', '카메라 권한이 필요합니다.');
                          return;
                        }
                      }
                      setShowCamera(true);
                    }}
                  >
                    <Text style={styles.actionBtnText}>📷 셀카 촬영</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#1a1a42' }]}
                    onPress={pickImage}
                  >
                    <Text style={styles.actionBtnText}>🖼️ 갤러리</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : currentQuestion.type === 'select' ? (
              <View style={styles.options}>
                {currentQuestion.options?.map((option) => (
                  <TouchableOpacity
                    key={option.value || '__empty'}
                    style={[
                      styles.optionBtn,
                      currentValue === option.value && styles.optionBtnActive,
                    ]}
                    onPress={() => {
                      setCurrentValue(option.value);
                      // 자동 진행
                      setTimeout(() => {
                        const updatedProfile = { ...profile, [currentQuestion.id]: option.value };
                        setProfile(updatedProfile);
                        if (isLastStep) {
                          router.replace({
                            pathname: `/chat/${mode}`,
                            params: { profile: JSON.stringify(updatedProfile) },
                          });
                        } else {
                          setStep(step + 1);
                          setCurrentValue('');
                        }
                      }, 200);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      currentValue === option.value && styles.optionTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={currentValue}
                onChangeText={setCurrentValue}
                placeholder={currentQuestion.placeholder}
                placeholderTextColor="#9da3ff50"
                autoFocus
                onSubmitEditing={handleNext}
                returnKeyType={isLastStep ? 'done' : 'next'}
              />
            )}

            {/* 다음 버튼 (select 제외) */}
            {currentQuestion.type !== 'select' && (
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  ((!currentValue && !imageBase64) && currentQuestion.required) && styles.nextBtnDisabled,
                ]}
                onPress={handleNext}
                disabled={isAnalyzing || ((!currentValue && !imageBase64) && currentQuestion.required)}
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.nextBtnText}>  관상을 읽는 중...</Text>
                  </>
                ) : (
                  <Text style={styles.nextBtnText}>
                    {isLastStep ? '✦ 운명의 문을 열다' : '다음 →'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* 건너뛰기 */}
            {!currentQuestion.required && currentQuestion.type !== 'select' && (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => {
                  setStep(step + 1);
                  setCurrentValue('');
                }}
              >
                <Text style={styles.skipText}>건너뛰기</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  content: { padding: 24, paddingTop: 16 },
  progressBar: {
    height: 4, backgroundColor: '#12122e', borderRadius: 2, marginBottom: 8,
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#9333ea',
  },
  stepText: { fontSize: 13, color: '#9da3ff80', marginBottom: 32 },
  question: {
    fontSize: 24, fontWeight: '600', color: '#e8eaff',
    lineHeight: 36, marginBottom: 32,
  },
  input: {
    borderWidth: 1, borderColor: '#1a1a42', borderRadius: 12,
    padding: 16, fontSize: 18, color: '#e8eaff',
    backgroundColor: '#12122e',
  },
  options: { gap: 12 },
  optionBtn: {
    padding: 16, borderRadius: 12, borderWidth: 1,
    borderColor: '#1a1a42', backgroundColor: '#12122e',
  },
  optionBtnActive: { borderColor: '#9333ea', backgroundColor: '#9333ea20' },
  optionText: { fontSize: 16, color: '#e8eaff', fontWeight: '500' },
  optionTextActive: { color: '#c084fc' },
  nextBtn: {
    marginTop: 24, padding: 18, borderRadius: 14,
    backgroundColor: '#9333ea', alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.3 },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  skipBtn: { marginTop: 16, alignItems: 'center' },
  skipText: { fontSize: 14, color: '#9da3ff60' },
  // Camera
  cameraSection: { gap: 16 },
  preview: { width: '100%', height: 300, borderRadius: 14 },
  placeholder: {
    width: '100%', height: 240, borderRadius: 14,
    backgroundColor: '#12122e', borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#9333ea30', alignItems: 'center', justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: { fontSize: 14, color: '#9da3ff60' },
  cameraButtons: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  // Camera fullscreen
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40,
  },
  cameraCloseBtn: {
    position: 'absolute', top: 60, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  cameraBtnText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff',
  },
});

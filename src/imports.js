import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

export {
  React,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  AsyncStorage,
  DocumentPicker,
  Icon,
  useSafeAreaInsets,
  RNFS,
  Share
};

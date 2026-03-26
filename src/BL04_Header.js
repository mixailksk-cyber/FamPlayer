import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLOR } from './BL02_Constants';

const Header = ({ 
  title, 
  rightIcon, 
  onRightPress, 
  showBack, 
  onBack, 
  showSearch, 
  onSearchPress, 
  showPalette, 
  onPalettePress, 
  showFolders,
  onFoldersPress,
  children, 
  brandColor 
}) => {
  const insets = useSafeAreaInsets();
  const headerColor = brandColor || BRAND_COLOR;
  
  return (
    <>
      <StatusBar backgroundColor={headerColor} barStyle="light-content" />
      <View style={{ 
        backgroundColor: headerColor, 
        paddingTop: insets.top + 16, 
        paddingBottom: 16, 
        paddingLeft: insets.left + 16, 
        paddingRight: insets.right + 16, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {showFolders && (
            <TouchableOpacity onPress={onFoldersPress} style={{ marginRight: 16 }}>
              <Icon name="folder" size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, flex: 1 }} numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          {children && React.Children.map(children, (child, index) => (
            <View key={index}>
              {child}
            </View>
          ))}
          
          {showSearch && (
            <TouchableOpacity onPress={onSearchPress}>
              <Icon name="search" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {showPalette && (
            <TouchableOpacity onPress={onPalettePress}>
              <Icon name="palette" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress}>
              <Icon name={rightIcon} size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

export default Header;

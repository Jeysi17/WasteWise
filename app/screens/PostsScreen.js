import React, {useEffect, useState} from 'react';
import {Text, Image, ImageBackground, TouchableOpacity, StyleSheet, View, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import Header from '../../components/Home/header';
import colors from '../../constant/colors';
import { FlatList, GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import axios from 'axios';
import PostList from '../../components/Post/PostList';

const PostScreen = ({ navigation }) => {

 const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


useEffect(() => {
  GetPosts();
}, []);


const GetPosts = async () => {
   try {
        const response = await fetch(process.env.EXPO_BASE_URL+'/posts?orderField=approved_posts.id');
        const data = await response.json();
        console.log(data); // Check if data is received
    } catch (err) {
        console.error("Fetch error:", err);
    }
};


  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.lime_green }}>
      <Header />
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        >
          
          <ImageBackground
            source={require('../../assets/images/bg-image.jpg')}
            style={{
              height: 200,
              width: '100%',
            }}
          >
            <Text style={styles.title}>Event Title</Text>
            <Text style={styles.subtitle}>
              Lorem ipsum is a placeholder text commonly used in publishing and graphic design.
            </Text>
            <TouchableOpacity style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          </ImageBackground>
        <PostList posts={posts} />
       
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

export default PostScreen;

const styles = StyleSheet.create({
  title: {
    fontFamily: 'PSemi-Bold',
    fontSize: 30,
    alignSelf: 'center',
    marginTop: 10,
    color: colors.BG_color,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'PSemi-Bold',
    color: colors.BG_color,
    textAlign: 'center',
    marginHorizontal: 10,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  readMoreButton: {
    alignSelf: 'center',
    backgroundColor: colors.BG_color,
    padding: 5,
    borderRadius: 10,
    marginTop: 10,
  },
  readMoreText: {
    fontFamily: 'PSemi-Bold',
  },
  card: {
    backgroundColor: colors.pale_green,
    width: '90%',
    marginTop: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  image: {
    width: '100%',
    height: 150,
    marginTop: -3
  },
  
  commentButtonText: {
    fontFamily: 'PSemi-Bold',
    textAlign: 'center',
    color: '#000000',
    marginTop: 10
  },
  commentsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  commentItem: {
    backgroundColor: colors.light_gray,
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
    
  },
  commentAuthor: {
    fontFamily: 'PSemi-Bold',
    fontSize: 12,
    color: colors.dark_gray,
  },
  commentText: {
    fontFamily: 'PRegular',
    fontSize: 14,
  },
  noComments: {
    fontFamily: 'PRegular',
    fontStyle: 'italic',
    textAlign: 'center',
    color: colors.dark_gray,
    marginTop: 5,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 5,
    fontFamily: 'PSemi-Bold',
    width: '80%'
  },
  submitIcon: {
    height: 30,
    alignSelf: 'flex-start',
    width: 30,
    marginLeft: 20,
    marginTop: 8
  }
});
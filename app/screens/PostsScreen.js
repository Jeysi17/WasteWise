import React, {useState} from 'react';
import {Text, Image, ImageBackground, TouchableOpacity, StyleSheet, View, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import Header from '../../components/Home/header';
import colors from '../../constant/colors';
import { FlatList, GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const PostScreen = ({ navigation }) => {
  const posts = [
    { id: '1', name: 'John Carl Honrado', location: 'Osorio, Trece Martires', date: '2025-02-14'},
    { id: '2', name: 'John Wilbert Teloy', location: 'Cabuco, Trece Martires', date: '2025-01-14'},
    { id: '3', name: 'Eldien Royce Sioko', location: 'San Agustin, Trece Martires', date: '2025-03-14'},
  ];

  const comments = {
    '1': [
      {id: '1', comment: "Buti nalinis na 'yan", author: 'John Carl Honrado', location: 'Osorio, Trece Martires'},
      {id: '2', comment: "Baho na dyan e", author: 'Eldien Royce Sioko', location: 'Cabuco, Trece Martires'},
      {id: '3', comment: "Salamat CENRO!", author: 'John Wilbert Teloy', location: 'San Agustin, Trece Martires'},
    ],
   
   
  };

  const [activePostId, setActivePostId] = useState(null);
  
  const toggleComments = (postId) => {
    if (activePostId === postId) {
      setActivePostId(null);
    } else {
      setActivePostId(postId);
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
        
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>    
          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
          >
            {posts.map((post) => (
              <View 
                key={post.id}
                style={styles.card}
              >
                <View style={{flexDirection: 'row', backgroundColor: colors.BG_color, width: '100%', height: 45}}>
                  <Text style={{fontFamily: 'PSemi-Bold', marginTop: 5, margin: 5}}>{post.name}</Text>
                  <Text style={{margin: 5, paddingLeft: 80, fontSize: 10, fontFamily: 'PSemi-Bold', marginTop: 5}}>Posted on: {post.date}</Text>
                </View>
                <Text style={{marginTop: -20, margin: 5, fontFamily: 'PSemi-Bold', fontSize: 10}}>{post.location}</Text>
                
                <Image source={require('../../assets/images/bg-image.jpg')} style={styles.image}/>
                
                <TouchableOpacity
                  onPress={() => toggleComments(post.id)}
                >
                  <Text style={styles.commentButtonText}>
                    {activePostId === post.id ? 'Hide Comments' : 'Show Comments'}
                  </Text>
                </TouchableOpacity>
                
                {activePostId === post.id && (
                  <View style={styles.commentsContainer}>
                    {comments[post.id]?.length > 0 ? (
                      <FlatList
                        data={comments[post.id]}
                        scrollEnabled={false}
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) => (
                          <View style={styles.commentItem}>
                            <View style={{flexDirection: 'row'}}>
                              <Text style={styles.commentAuthor}>{item.author}:</Text>
                              <Text style={{...styles.commentAuthor, marginLeft: 45, marginTop: -1}}>{item.location}</Text>
                            </View>
                            <Text style={styles.commentText}>{item.comment}</Text>
                          </View>
                        )}
                      />
                    ) : (
                      <Text style={styles.noComments}>No comments yet</Text>
                    )}
                    <View style={{flexDirection: 'row'}}>
                        <TextInput
                        placeholder='Write a comment...'
                        placeholderTextColor={'#000000'}
                        style={styles.commentInput}
                      ></TextInput>
                      <TouchableOpacity>
                      <Image source={require('../../assets/icons/submit.png')} style={styles.submitIcon}/>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
              </View>
            ))}
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
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
import React from 'react';
import {Text, Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import colors from '../../constant/colors';

    const ArticleCard= ({title, content}) => {
      return (
        <View style={styles.card}>
            <View style={styles.articleContainer}>
                <Image source={require('../../assets/images/cover1.jpeg')} style={styles.articleTThumbnail}></Image>
                <View style={{ flexDirection: 'column', width: '60%'}}>
                    <Text style={styles.articleTitle}>{title}</Text>
                    <Text style={styles.articleDetails}>{content}</Text>
                </View>
            </View>
                <TouchableOpacity>
                    <Text style={styles.infoLink}>Click Here to Read the Article</Text>
                </TouchableOpacity>
        </View>
      );
    };
    
    const styles = StyleSheet.create({ 
        articleContainer: {
            backgroundColor: colors.pale_green,
            width: '100%',
            marginTop: 10,
            padding: '4%',
            paddingTop: '2%',
            paddingBottom: '2%',
            flexDirection: 'row',
            height: "auto",
            borderBottomWidth: 3,
            borderBottomColor: colors.lime_green,
        },
        articleTitle: {
            fontFamily: 'PSemi-Bold',
            fontSize: 17,
            marginTop: '5%',
            textAlign: 'center',
        },
        articleTThumbnail: {
            width: '40%',
            height: 170,
            marginLeft: 1,
        },
        articleDetails: {
            fontFamily: 'PSemi-Bold',
            fontSize: 10,
            marginTop: '2%',
            textAlign: 'center',
        },
        card: {
            backgroundColor: colors.pale_green,
            width: '97%',
            height: 'auto',
            marginTop: 10,
            alignSelf: 'center',
            overflow: 'hidden',
            borderWidth: 3,
            borderRadius: 10,
            borderColor: colors.border_green,
            flexDirection: 'column',
        },
        infoLink: {
            backgroundColor: colors.pale_green,
            width: '100%',
            alignSelf: 'center',
            padding: 10,
            fontFamily: 'PSemi-Bold',
            textAlign: 'center',
        },
});
    
    export default ArticleCard;
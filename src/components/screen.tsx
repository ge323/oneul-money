import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
    children: ReactNode;
};

export default function Screen({
    children,
}: Props) {
    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={['top']}
        >
            <View style={styles.content}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});
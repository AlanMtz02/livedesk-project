import LoginForm from '../auth/LoginForm';
import styles from './LoginPage.module.css';

function LoginPage(){
    return (
        <div className={styles.pantallaCompleta}>
            <LoginForm></LoginForm>
        </div>

    );

}

export default LoginPage;
package com.keeplink

import android.content.pm.PackageManager
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

class SecurityModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

    override fun getName() = "KeepLinkSecurity"

    @ReactMethod
    fun fingerprintStatus(promise: Promise) {
        if (!ctx.packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)) {
            promise.resolve("unavailable")
            return
        }
        val result = BiometricManager.from(ctx)
            .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
        promise.resolve(
            when (result) {
                BiometricManager.BIOMETRIC_SUCCESS -> "available"
                BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "none_enrolled"
                else -> "unavailable"
            }
        )
    }

    @ReactMethod
    fun authenticate(title: String, cancel: String, promise: Promise) {
        val activity = currentActivity as? FragmentActivity
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "No activity")
            return
        }
        UiThreadUtil.runOnUiThread {
            try {
                val callback = object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        promise.resolve(true)
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        promise.resolve(false)
                    }
                }
                val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), callback)
                val info = BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setNegativeButtonText(cancel)
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                    .build()
                prompt.authenticate(info)
            } catch (e: Exception) {
                promise.reject("E_BIOMETRIC", e.message)
            }
        }
    }

    @ReactMethod
    fun makePinRecord(pin: String, promise: Promise) {
        Thread {
            try {
                val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
                promise.resolve(toHex(salt) + ":" + toHex(derive(pin, salt)))
            } catch (e: Exception) {
                promise.reject("E_PIN", e.message)
            }
        }.start()
    }

    @ReactMethod
    fun checkPin(pin: String, record: String, promise: Promise) {
        Thread {
            try {
                val parts = record.split(":")
                if (parts.size != 2) {
                    promise.resolve(false)
                    return@Thread
                }
                val expected = fromHex(parts[1])
                val actual = derive(pin, fromHex(parts[0]))
                promise.resolve(MessageDigest.isEqual(expected, actual))
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }.start()
    }

    private fun derive(pin: String, salt: ByteArray): ByteArray =
        SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1")
            .generateSecret(PBEKeySpec(pin.toCharArray(), salt, 64000, 256))
            .encoded

    private fun toHex(b: ByteArray) = b.joinToString("") { "%02x".format(it) }

    private fun fromHex(s: String) = ByteArray(s.length / 2) { s.substring(it * 2, it * 2 + 2).toInt(16).toByte() }
}

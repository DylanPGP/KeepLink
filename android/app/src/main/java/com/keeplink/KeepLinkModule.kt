package com.keeplink

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale

class KeepLinkModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx), ActivityEventListener {

    private var pending: Promise? = null
    private var pendingContent: String? = null

    init {
        ctx.addActivityEventListener(this)
    }

    override fun getName() = "KeepLinkNative"

    @ReactMethod
    fun getLocale(promise: Promise) {
        promise.resolve(Locale.getDefault().language)
    }

    @ReactMethod
    fun copyText(label: String, text: String) {
        val cm = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText(label, text))
    }

    @ReactMethod
    fun saveFile(name: String, mime: String, content: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "No activity")
            return
        }
        if (pending != null) {
            promise.reject("E_BUSY", "Busy")
            return
        }
        pending = promise
        pendingContent = content
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = mime
            putExtra(Intent.EXTRA_TITLE, name)
        }
        activity.startActivityForResult(intent, REQ_SAVE)
    }

    @ReactMethod
    fun pickFile(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "No activity")
            return
        }
        if (pending != null) {
            promise.reject("E_BUSY", "Busy")
            return
        }
        pending = promise
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }
        activity.startActivityForResult(intent, REQ_OPEN)
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REQ_SAVE && requestCode != REQ_OPEN) return
        val promise = pending ?: return
        val content = pendingContent
        pending = null
        pendingContent = null
        val uri = data?.data
        if (resultCode != Activity.RESULT_OK || uri == null) {
            promise.resolve(null)
            return
        }
        try {
            if (requestCode == REQ_SAVE) {
                val out = ctx.contentResolver.openOutputStream(uri, "wt")
                    ?: throw IllegalStateException("No stream")
                out.use { it.write((content ?: "").toByteArray(Charsets.UTF_8)) }
                promise.resolve(true)
            } else {
                val input = ctx.contentResolver.openInputStream(uri)
                    ?: throw IllegalStateException("No stream")
                val bytes = input.use { it.readBytes() }
                if (bytes.size > MAX_BYTES) {
                    promise.reject("E_TOO_BIG", "File too large")
                } else {
                    promise.resolve(String(bytes, Charsets.UTF_8))
                }
            }
        } catch (e: Exception) {
            promise.reject("E_IO", e.message)
        }
    }

    override fun onNewIntent(intent: Intent) {}

    companion object {
        const val REQ_SAVE = 7101
        const val REQ_OPEN = 7102
        const val MAX_BYTES = 5_000_000
    }
}

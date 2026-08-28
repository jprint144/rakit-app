package com.rakit.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  private class AuthBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun open(url: String) {
      activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.addJavascriptInterface(AuthBridge(this), "RakitAuth")
  }
}

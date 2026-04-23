package com.husseinbairam.bookings;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;

public class IntroActivity extends AppCompatActivity {
    private static final long INTRO_DURATION_MS = 3000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable openMainApp = () -> {
        startActivity(new Intent(IntroActivity.this, MainActivity.class));
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_intro);

        View introCard = findViewById(R.id.intro_card);
        View introLogo = findViewById(R.id.intro_logo);

        introCard.setAlpha(0f);
        introCard.setScaleX(0.92f);
        introCard.setScaleY(0.92f);
        introCard.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(700L).start();

        introLogo.setAlpha(0f);
        introLogo.setScaleX(0.9f);
        introLogo.setScaleY(0.9f);
        introLogo.animate().alpha(1f).scaleX(1f).scaleY(1f).setStartDelay(180L).setDuration(850L).start();

        handler.postDelayed(openMainApp, INTRO_DURATION_MS);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(openMainApp);
        super.onDestroy();
    }
}

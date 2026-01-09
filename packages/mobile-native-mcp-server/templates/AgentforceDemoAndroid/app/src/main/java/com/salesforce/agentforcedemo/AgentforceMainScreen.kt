/*
 * Copyright (c) 2019-present, salesforce.com, inc.
 * All rights reserved.
 * Redistribution and use of this software in source and binary forms, with or
 * without modification, are permitted provided that the following conditions
 * are met:
 * - Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * - Neither the name of salesforce.com, inc. nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission of salesforce.com, inc.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
package com.salesforce.agentforcedemo

import android.app.Application
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Message
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.salesforce.android.agentforcesdkimpl.AgentforceClient
import com.salesforce.android.agentforcesdkimpl.configuration.AgentforceMode
import com.salesforce.android.agentforcesdkimpl.configuration.ServiceAgentConfiguration
import com.salesforce.android.agentforceservice.*

//import com.salesforce.android.agentforcesdk.AgentforceMode
//import com.salesforce.android.agentforcesdk.ServiceAgentConfiguration
//import com.salesforce.android.agentforcesdk.ui.AgentforceConversationContainer

/**
 * Main screen for Agentforce SDK integration.
 *
 * This composable provides the main UI with a button to start
 * a chat conversation with the Agentforce service agent.
 *
 * @param viewModel The ViewModel managing UI state
 * @param settings The Settings containing service agent configuration parameters
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentforceMainScreen(
    viewModel: AgentforceViewModel,
    settings: Settings = Settings()
) {
    val context = LocalContext.current
    val application = context.applicationContext as Application

    // Configure Service agent using builder pattern
    val agentforceMode = remember(settings) {
        AgentforceMode.ServiceAgent(
            serviceAgentConfiguration = ServiceAgentConfiguration.builder(
                serviceApiURL = settings.serviceApiURL,
                organizationId = settings.organizationId,
                esDeveloperName = settings.esDeveloperName
            ).build()
        )
    }

    // Initialize Agentforce client
    val agentforceClient = remember { AgentforceClient() }
    var isClientInitialized by remember { mutableStateOf(false) }

    // Initialize the client when the composable is first composed
    LaunchedEffect(Unit) {
        agentforceClient.init(
            authCredentialProvider = CredentialProvider(),
            agentforceMode = agentforceMode,
            application = application
        )
        isClientInitialized = true
    }

    // Start a conversation once client is initialized
    val conversation = remember(isClientInitialized) {
        if (isClientInitialized) {
            // Start the conversation
            agentforceClient.startAgentforceConversation()
//            // Get the conversation session
//            agentforceClient
//            agentforceClient.fetchAgentforceSession(settings.agentId)
        } else {
            null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Agentforce Demo") }
            )
        }
    ) { paddingValues ->
        HomeContent(
            modifier = Modifier.padding(paddingValues),
            onStartChat = { viewModel.showChat() }
        )
    }

    // Show Agentforce chat UI when requested
    if (viewModel.showAgentforceUI && conversation != null) {
        agentforceClient.AgentforceLauncherContainer(conversation) {

        }

    }
}

/**
 * Home content with chat button.
 *
 * @param modifier Modifier to be applied to the layout
 * @param onStartChat Callback when the Start Chat button is clicked
 */
@Composable
private fun HomeContent(
    modifier: Modifier = Modifier,
    onStartChat: () -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App icon
        Icon(
            imageVector = Icons.Default.Message,
            contentDescription = "Message",
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // App title
        Text(
            text = "Agentforce SDK Demo",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Subtitle
        Text(
            text = "Tap the button below to start chatting",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Start Chat button
        Button(
            onClick = onStartChat,
            modifier = Modifier.width(200.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Chat,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Start Chat")
        }
    }
}

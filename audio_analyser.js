/**
 * Copyright 2018 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function(RED) {
	var AudioAnalyser = require('audio-analyser');

	function AudioAnalyserNode(config) {
		RED.nodes.createNode(this, config);
        this.minDecibels           = config.minDecibels || -100;
        this.maxDecibels           = config.maxDecibels || -30;
        this.fftSize               = config.fftSize || 1024;
        this.smoothingTimeConstant = config.smoothingTimeConstant || 0.2;
        this.channel               = config.channel || 0;
        this.bufferSize            = config.bufferSize || 44100;

        var node = this;
        
        node.audioAnalyser = new AudioAnalyser({
            // Magnitude diapasone, in dB
            minDecibels: config.minDecibels,
            maxDecibels: config.maxDecibels,
            // Number of time samples to transform to frequency
            fftSize: config.fftSize,
            // Number of frequencies, twice less than fftSize
            frequencyBinCount: config.fftSize/2,
            // Smoothing, or the priority of the old data over the new data
            smoothingTimeConstant: config.smoothingTimeConstant,
            // Number of channel to analyse
            channel: config.channel,
            // Size of time data to buffer
            bufferSize: config.bufferSize,
            // Windowing function for fft, https://github.com/scijs/window-functions
            applyWindow: function (sampleNumber, totalSamples) {
            }
            //...pcm-stream params, if required
        })
        
        node.audioAnalyser.on('data', function (chunk) {
            var floatFreq = this.getFloatFrequencyData(new Float32Array(this.fftSize));
            var floatTime = this.getFloatTimeDomainData(new Float32Array(this.fftSize));
            var byteFreq = this.getByteFrequencyData(new Uint8Array(this.fftSize));
            var byteTime = this.getByteTimeDomainData(new Uint8Array(this.fftSize));
            var freq = this.getFrequencyData();
            var time = this.getTimeData();

          // TODO node.send( ... );
        });

        node.on("input", function(msg) {
            var audioChunk = msg.payload;
          
            if (!audioChunk) {
              audioChunk = new Buffer();
            }
            
            if (!Buffer.isBuffer(audioChunk)) {
              return;
            }
        
            // This will trigger the on-data call of the audio analyser
            node.audioAnalyser._transform(audioChunk);
        });
    }
  
	RED.nodes.registerType("audio-analyser", AudioAnalyserNode);
}

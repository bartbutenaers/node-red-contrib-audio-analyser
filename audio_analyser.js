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
        this.analysis              = config.analysis || 'time';
        this.minDecibels           = config.minDecibels || -100;
        this.maxDecibels           = config.maxDecibels || -30;
        this.fftSize               = config.fftSize || 2048;
        this.smoothingTimeConstant = config.smoothingTimeConstant || 0.2;
        this.channel               = config.channel || 0;
        this.bufferSize            = config.bufferSize || 44100;

        var node = this;
        
        node.audioAnalyser = new AudioAnalyser({
            // The minimum value for the range of results 
            // 0 dB is the loudest possible sound, -10 dB is a 10th of that, ...
            minDecibels: config.minDecibels,
            maxDecibels: config.maxDecibels,
            // Number of time samples to transform to frequency.
            // An unsigned integer, representing the window size of the FFT, given in number of samples. 
            // A higher value will result in more details in the frequency domain but fewer details in the time domain.
            fftSize: config.fftSize,
            // Number of frequency measurements, twice less than fftSize
            frequencyBinCount: config.fftSize/2,
            // Smoothing, or the priority of the old data over the new data, to make the meter less jittery. 
            // With this variable we use input from a longer time period to calculate the amplitudes, this results in a more smooth meter.
            // A double within the range 0 to 1 (0 meaning no time averaging)
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
            var analyserData;
            
            switch (node.analysis) {
                case 'time':
                    // The byte values do range between 0-255
                    analyserData = this.getTimeData();
                    break;
                case 'freq':
                    // Get a normalized array of values between 0 and 255
                    // The frequency bands are split equally, so each element N of your array corresponds to: N * samplerate / fftSize
                    // E.g. when samplerate is 44100 and fftSize is 512, then the first bin is 0 and the second will be 86.13 Hz and so on ...
                    analyserData = this.getFrequencyData();
                    break;           
            }                    

            node.send( {payload: analyserData});
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
            node.audioAnalyser._transform(audioChunk, null, function() {});
        });
    }
  
	RED.nodes.registerType("audio-analyser", AudioAnalyserNode);
}

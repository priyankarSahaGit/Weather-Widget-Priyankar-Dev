import { LightningElement, track, wire, api } from 'lwc';
import getCurrentWeather from '@salesforce/apex/FetchWeatherCtrl.getCurrentWeather';
import getWeatherForecast from '@salesforce/apex/FetchWeatherCtrl.getWeatherForecast';
import getCityCoordinates from '@salesforce/apex/FetchWeatherCtrl.getCityCoordinates';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class WeatherWidgetDetail extends LightningElement {
    @track latitude;
    @track longitude;
    @track isLoaded = false;
    @track isSearchLoaded = false;
    @track isForecastLoaded = false;
    @track uvi;
    @track isHourlyLoaded = false;
    @track weatherData = {};
    @track currentData = {};
    @track forecastDailyData = [];
    @track forecastHourlyData = [];
    @track weatherLogo;
    @track temp;
    @track temp_min;
    @track temp_max;
    @track feels_like;
    @track pressure;
    @track humidity;
    @track wind_speed;
    @track degreeCelcius = '°C';
    @track degreeFarhenheit = '°F';
    @track city;
    @track country;
    @track strError;
    @track currentDate;// = new Date().toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})
    @track currentTime;
    @track dayTime = false;
    @track nightTime = false;
    @track snowTime = false;
    @track snowTime = false;
    @api cityQuery = '';
    @track sunriseTime;
    @track sunsetTime;
    @track weatherCondition;  

    connectedCallback(){
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                // Get the Latitude and Longitude from Geolocation API
                this.latitude = position.coords.latitude;
                this.longitude = position.coords.longitude;
                this.fetchCurrentWeather();
                this.fetchWeatherForecast();
            },
            (e) => {
                this.strError = e.message;
            },
            {
                enableHighAccuracy: true,
            });
        }
    }

    fetchCurrentWeather(event){
        getCurrentWeather({latitude : this.latitude, longitude : this.longitude})
        .then(data => {
            this.weatherData = JSON.parse(data);
            console.log('---Weather Fetched---',this.weatherData);
            if(this.weatherData){
                this.temp = Math.round(this.weatherData.main.temp);
                this.feels_like = Math.round(this.weatherData.main.feels_like);
                this.temp_max = Math.round(this.weatherData.main.temp_max);
                this.temp_min = Math.round(this.weatherData.main.temp_min);
                this.city = this.weatherData.name;
                this.wind_speed = this.weatherData.wind.speed;
                this.humidity = this.weatherData.main.humidity;
                if((this.weatherData.dt > this.weatherData.sys.sunset)||(this.weatherData.dt < this.weatherData.sys.sunrise)){
                    this.nightTime = true;
                    this.weatherLogo = 'custom:custom10';
                }
                else if((this.weatherData.dt > this.weatherData.sys.sunrise)||(this.weatherData.dt < this.weatherData.sys.sunset)){
                    this.dayTime = true;
                    this.weatherLogo = 'custom:custom3';
                }
                if(this.weatherData.weather[0].main == 'Rain'){
                    this.weatherLogo = 'standard:calibration';
                }
                if(this.weatherData.weather[0].main == 'Clouds'){
                    this.weatherLogo = 'standard:default';
                }
                let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
                this.country = regionNames.of(this.weatherData.sys.country);
                this.sunriseTime = this.formatUnixToAMPM(this.weatherData.sys.sunrise);
                this.sunsetTime = this.formatUnixToAMPM(this.weatherData.sys.sunset);
                this.currentDate = this.formatUnixToDate(this.weatherData.dt, true);
                this.currentTime = this.formatUnixToAMPM(this.weatherData.dt);
                this.weatherCondition = this.weatherData.weather[0].main;
                this.isLoaded = true;
                this.isSearchLoaded = true;
            }
        }).catch(err => console.log(err));
    }

    fetchWeatherForecast(event){
        getWeatherForecast({latitude : this.latitude, longitude : this.longitude})
        .then(data => {
            this.currentData = JSON.parse(data).current;
            this.forecastDailyData = JSON.parse(data).daily;
            this.forecastHourlyData = JSON.parse(data).hourly.slice(0,24);
            if(this.currentData.uvi >= 11){
                this.uvi = 'Extreme';
            }else if(this.currentData.uvi >= 8 && this.currentData.uvi < 11){
                this.uvi = 'Very high';
            }else if(this.currentData.uvi >= 6 && this.currentData.uvi <= 7){
                this.uvi = 'High';
            }else if(this.currentData.uvi >= 3 && this.currentData.uvi <= 5){
                this.uvi = 'Moderate';
            }else if(this.currentData.uvi <= 2){
                this.uvi = 'Low';
            }
            console.log('---Forecast Fetched---',this.forecastDailyData);
            console.log('---Hourly Fetched---',this.forecastHourlyData);
            if(this.forecastDailyData){
                this.forecastDailyData.forEach(dailyData => {
                    dailyData.formattedDate = this.formatUnixToDate(dailyData.dt, false);
                    dailyData.weatherCondition = dailyData.weather[0].main;
                    dailyData.temp.day = Math.round(dailyData.temp.day);
                    dailyData.temp.night = Math.round(dailyData.temp.night);
                    if(dailyData.weather[0].main == 'Rain'){
                        dailyData.weatherLogo = 'standard:calibration';
                    }
                    else if(dailyData.weather[0].main == 'Clear'){
                        dailyData.weatherLogo = 'custom:custom3';
                    }
                    else if(dailyData.weather[0].main == 'Clouds'){
                        dailyData.weatherLogo = 'standard:default';
                    }
                    else if(dailyData.weather[0].main == 'Snow'){
                        dailyData.weatherLogo = 'standard:password';
                    }
                    else{
                        dailyData.weatherLogo = 'custom:custom3';
                    }
                });
                this.isForecastLoaded = true;
            }
            if(this.forecastHourlyData){
                this.forecastHourlyData.forEach(hourlyData => {
                    hourlyData.formattedDate = this.formatUnixToDate(hourlyData.dt, false);
                    hourlyData.formattedTime = this.formatUnixToAMPM(hourlyData.dt);
                    hourlyData.weatherCondition = hourlyData.weather[0].main;
                    hourlyData.temp = Math.round(hourlyData.temp);
                    if(hourlyData.weather[0].main == 'Rain'){
                        hourlyData.weatherLogo = 'standard:calibration';
                    }
                    else if(hourlyData.weather[0].main == 'Clear'){
                        hourlyData.weatherLogo = 'custom:custom3';
                    }
                    else if(hourlyData.weather[0].main == 'Clouds'){
                        hourlyData.weatherLogo = 'standard:default';
                    }
                    else if(hourlyData.weather[0].main == 'Snow'){
                        hourlyData.weatherLogo = 'standard:password';
                    }
                    else{
                        hourlyData.weatherLogo = 'custom:custom3';
                    }
                });
                this.isHourlyLoaded = true;
            }
            this.isLoaded = true;
        }).catch(err => console.log(err));
    }

    cityOnChangeHandler(event){
        this.cityQuery = event.target.value;
    }

    handleKeyUp(event){
        const isEnterKey = event.keyCode === 13;
        if(isEnterKey && this.cityQuery.length > 0){
            this.citySearchHandler();
        }
    }

    citySearchHandler(event){
        if(this.cityQuery.length > 0){
            this.isSearchLoaded = false;
            this.isForecastLoaded = false;
            this.isHourlyLoaded = false;
        getCityCoordinates({cityName : this.cityQuery})
        .then(data => {
            var coordinateData = JSON.parse(data)[0];
            console.log('---Coordinate Fetched---',coordinateData);
            if(coordinateData != undefined){
                this.latitude = coordinateData.lat;
                this.longitude = coordinateData.lon;
                this.fetchCurrentWeather();
                this.fetchWeatherForecast();
            } else{
                this.isLoaded = true;
                this.isSearchLoaded = true;
                this.isForecastLoaded = true;
                this.isHourlyLoaded = true;
                const evt = new ShowToastEvent({
                title: '',
                message: 'City not found',
                variant: 'info',
            });
            this.dispatchEvent(evt);
            }
        }).catch(err => {
            console.log(err);
            this.isLoaded = true;
            this.isSearchLoaded = true;
            this.isForecastLoaded = true;
            this.isHourlyLoaded = false;
            const evt = new ShowToastEvent({
                title: '',
                message: 'Some error occurred',
                variant: 'error',
            });
            this.dispatchEvent(evt);
        });
        }  
    }

    formatUnixToAMPM(unixTimestamp){
        var date = new Date(unixTimestamp * 1000);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    formatUnixToDate(unixTimestamp, yearFlag){
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var currentDate = new Date(unixTimestamp * 1000);
        var day = weekday[currentDate.getDay()];
        var year = currentDate.getFullYear();
        var month = months[currentDate.getMonth()];
        var date = currentDate.getDate();
        if(yearFlag){
            var return_date = day + ', ' + date + ' ' + month + ' ' + year;
        }
        else{
            var return_date = day + ', ' + date + ' ' + month;
        }
        return return_date;
    }
}
import { LightningElement, track, wire, api } from 'lwc';
import getCurrentWeather from '@salesforce/apex/FetchWeatherCtrl.getCurrentWeather';
import getCityCoordinates from '@salesforce/apex/FetchWeatherCtrl.getCityCoordinates';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class WeatherWidgetDetail extends LightningElement {
    @track latitude;
    @track longitude;
    @track isLoaded = false;
    @track isSearchLoaded = false;
    @track weatherData = {};
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
                this.currentDate = this.formatUnixToDate(this.weatherData.dt);
                this.currentTime = this.formatUnixToAMPM(this.weatherData.dt);
                this.weatherCondition = this.weatherData.weather[0].main;
                this.isLoaded = true;
                this.isSearchLoaded = true;
            }
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
        getCityCoordinates({cityName : this.cityQuery})
        .then(data => {
            var coordinateData = JSON.parse(data)[0];
            console.log('---Coordinate Fetched---',coordinateData);
            if(coordinateData != undefined){
                this.latitude = coordinateData.lat;
                this.longitude = coordinateData.lon;
                this.fetchCurrentWeather();
            } else{
                this.isLoaded = true;
                this.isSearchLoaded = true;
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

    formatUnixToDate(unixTimestamp){
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var currentDate = new Date(unixTimestamp * 1000);
        var day = weekday[currentDate.getDay()];
        var year = currentDate.getFullYear();
        var month = months[currentDate.getMonth()];
        var date = currentDate.getDate();
        var return_date = day + ' ' + date + ' ' + month + ' ' + year;
        return return_date;
    }
}
public with sharing class FetchWeatherCtrl {

    public FetchWeatherCtrl() {

    }

    @AuraEnabled (cacheable = true)
    public static string getCurrentWeather(Decimal latitude, Decimal longitude){
        try {
            if(latitude == null || longitude == null){
                throw new AuraHandledException('Failed to retrieve coordinates');
            }
            Open_Weather_Map__mdt weatherCode = Open_Weather_Map__mdt.getInstance('Current_Weather');
            String location = 'lat=' + latitude + '&' + 'lon=' + longitude;
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:Open_Weather_API?' + location + '&appid=' + weatherCode.App_Key__c + '&units=metric');
            req.setMethod('GET');
            Http http = new Http();
            HTTPResponse res = http.send(req);
            System.debug('---Print Response Current Weather---'+res.getBody());
            return res.getBody();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled (cacheable = true)
    public static string getWeatherForecast(Decimal latitude, Decimal longitude){
        try {
            if(latitude == null || longitude == null){
                throw new AuraHandledException('Failed to retrieve forecast');
            }
            Open_Weather_Map__mdt weatherCode = Open_Weather_Map__mdt.getInstance('Current_Weather');
            String location = 'lat=' + latitude + '&' + 'lon=' + longitude;
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:Open_Weather_API_Detailed?' + location + '&exclude=minutely,alerts&appid=' + weatherCode.App_Key__c + '&units=metric');
            req.setMethod('GET');
            Http http = new Http();
            HTTPResponse res = http.send(req);
            System.debug('---Print Response Forecast---'+res.getBody());
            return res.getBody();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getCityCoordinates(String cityName){
        try {
            if(cityName == null || cityName == ''){
                throw new AuraHandledException('City not found');
            }
            String modifiedCity = cityName.replace(' ','+');
            Open_Weather_Map__mdt weatherCode = Open_Weather_Map__mdt.getInstance('Current_Weather');
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:Open_Weather_Geo_Code?' + 'q=' + modifiedCity + '&limit=1' + '&appid=' + weatherCode.App_Key__c);
            req.setMethod('GET');
            Http http = new Http();
            HTTPResponse res = http.send(req);
            if(res.getStatusCode() == 200 || res.getStatusCode() == 201){
                System.debug('---Print Response Coordinateds---'+res.getBody());
                return res.getBody();
            }else{
                throw new AuraHandledException('City not found');
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string getTimeZone(Decimal latitude, Decimal longitude){
        try {
            if(latitude == null || longitude == null){
                throw new AuraHandledException('Failed to retrieve timezone');
            }
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:Timezone_API?' + 'latitude=' + latitude +'&longitude=' + longitude);
            req.setMethod('GET');
            Http http = new Http();
            HTTPResponse res = http.send(req);
            System.debug('---Print Response Timezone---'+res.getBody());
            return res.getBody();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
}
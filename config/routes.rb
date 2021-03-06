ActionController::Routing::Routes.draw do |map|
  # The priority is based upon order of creation: first created -> highest priority.

  # Sample of regular route:
  #   map.connect 'products/:id', :controller => 'catalog', :action => 'view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   map.purchase 'products/:id/purchase', :controller => 'catalog', :action => 'purchase'
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   map.resources :products

  # Sample resource route with options:
  #   map.resources :products, :member => { :short => :get, :toggle => :post }, :collection => { :sold => :get }

  # Sample resource route with sub-resources:
  #   map.resources :products, :has_many => [ :comments, :sales ], :has_one => :seller

  # Sample resource route within a namespace:
  #   map.namespace :admin do |admin|
  #     # Directs /admin/products/* to Admin::ProductsController (app/controllers/admin/products_controller.rb)
  #     admin.resources :products
  #   end

  # You can have the root of your site routed with map.root -- just remember to delete public/index.html.
  # map.root :controller => "welcome"

  # See how all your routes lay out with "rake routes"

  # Install the default routes as the lowest priority.

	map.namespace(:admin) do |admin|
    admin.resources :game_types
		admin.resources :blind_values
		admin.resources :winner_prizes
  end

	map.simple_captcha '/simple_captcha/:action', :controller => 'simple_captcha'
	
  map.root :controller => 'games'
	map.resource :user_session
  map.login 'login', :controller => 'user_sessions', :action => 'new'
  map.leave_game ':game_id/leave', :controller => 'players', :action => 'destroy'
  map.resources :users
	map.add_chips 'add_chips', :controller => 'purses', :action => 'add_chips', :requirements => {:method => :put}
	map.add_money 'add_money', :controller => 'purses', :action => 'add_money', :requirements => {:method => :put}
	map.resources :purses, :collection => { :refill_chips_info => :get }
  map.resources :actions, :collection => { :omitted => :get, :timeout => :post }
  map.resources :log_messages
  map.resources :games, :has_many => 'players', :member => { :info => :get }, :collection => { :started => :get, :finished => :get }
  map.resources :players, :member => { :i_am_back => :put }
  map.game_types '/game_types', :controller => 'game_types', :action => 'index'
  map.paid_game_types '/game_types/paid', :controller => 'game_types', :action => 'paid'
  map.resources :notes
  map.connect 'game_synchronizers/:action/:game_id', :controller => 'game_synchronizers'
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
  
end

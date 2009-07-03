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

  map.root :controller => 'games'
	map.resource :user_session
  map.login 'login', :controller => 'user_sessions', :action => 'new'
  map.leave_game ':game_id/leave', :controller => 'players', :action => 'destroy'
	map.really_pause 'game_synchronizers/:game_id/really_pause', :controller => 'game_synchronizers', :action => 'really_pause'
	map.next_stage 'game_synchronizers/:game_id/stage', :controller => 'game_synchronizers', :action => 'stage'
	map.next_stage 'game_synchronizers/:game_id/distribution', :controller => 'game_synchronizers', :action => 'distribution'
  map.resources :users
  map.resources :actions, :collection => { :omitted => :get, :timeout => :post }
  map.resources :log_messages
  map.resources :games, :has_many => 'players'
  map.resources :players, :member => { :i_am_back => :put }
  map.resources :game_types
  map.resources :notes
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
  
end

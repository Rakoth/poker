require 'rake'
namespace :create do
	desc "Reset migrations and create all users and game types"
	task :refresh => :environment do
		Rake::Task['db:migrate:reset'].invoke

		User.delete_all
		GameType.delete_all
		5.times do |i|
			user = User.new :password => '1111', :password_confirmation => '1111'
			user.login = "user#{i}"
			user.email = "user#{i}@mail.ru"
			user.save_without_validation
			user.create_purse :balance => 1000
		end

		3.times do |i|
      GameType.create(:title => " #{i+1} Тип",
				:max_players => 2 + i,
				:start_stack => 1000 * (i + 1),
				:start_cash => i + 5,
				:additional_cash => i,
				:start_blind => 100 * (i + 1),
				:bet_multiplier => 1,
				:change_level_time => 4 + i,
				:time_for_action => 30,
				:min_level => 0,
				:max_level => 10
      )
    end
		
    Rake::Task['log:clear'].invoke
	end
end
